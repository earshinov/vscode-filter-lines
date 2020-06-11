import vscode, { DocumentHighlight } from 'vscode';

import { escapeRegexp, catchErrors } from './utils';


type SearchType = 'string'|'regex';

interface PromptFilterLinesArgs {
  search_type?: SearchType;
  invert_search?: boolean;
  with_context?: boolean;
  context?: number|null;
  before_context?: number|null;
  after_context?: number|null;
}

interface FilterLinesArgs {
  search_type?: SearchType;
  invert_search?: boolean;
  needle: string;
  context?: number|null;
  before_context?: number|null;
  after_context?: number|null;
}


// Export for tests
export interface ExtensionSettings {
  caseSensitiveStringSearch: boolean;
  caseSensitiveRegexSearch: boolean;
  preserveSearch: boolean;
  lineNumbers: boolean;
  createNewTab: boolean;
}

// Export for tests
export const DEFAULT_CONFIGURATION: Readonly<ExtensionSettings> = {
  caseSensitiveStringSearch: false,
  caseSensitiveRegexSearch: true,
  preserveSearch: true,
  lineNumbers: false,
  createNewTab: true,
};

/* istanbul ignore next */
class Configuration implements Readonly<ExtensionSettings> {
  private config = vscode.workspace.getConfiguration('filterlines');

  get caseSensitiveStringSearch() { return this.config.get<boolean>('caseSensitiveStringSearch', DEFAULT_CONFIGURATION.caseSensitiveStringSearch); }
  get caseSensitiveRegexSearch()  { return this.config.get<boolean>('caseSensitiveRegexSearch',  DEFAULT_CONFIGURATION.caseSensitiveRegexSearch);  }
  get preserveSearch()            { return this.config.get<boolean>('preserveSearch',            DEFAULT_CONFIGURATION.preserveSearch);            }
  get lineNumbers()               { return this.config.get<boolean>('lineNumbers',               DEFAULT_CONFIGURATION.lineNumbers);               }
  get createNewTab()              { return this.config.get<boolean>('createNewTab',              DEFAULT_CONFIGURATION.createNewTab);              }
}

// Export for tests
export const DI = {

  /* istanbul ignore next */
  getConfiguration(): Readonly<ExtensionSettings> {
    return new Configuration();
  }
};


const STORAGE = {
  latestSearch: '',
  latestContext: '',
};

// Export for tests
export function clearStorage() {
  STORAGE.latestSearch = '';
  STORAGE.latestContext = '';
}


export function activate(this: void, context: vscode.ExtensionContext) {

  context.subscriptions.push(

    // Provide wrapper commands to be bound in package.json > "contributes" > "commands".
    // If one command is bound several times with different "args", VS Code only displays the last entry in the Ctrl-Shift-P menu.
    vscode.commands.registerTextEditorCommand('filterlines.includeLinesWithRegex', catchErrors((editor, edit, args) => {
      const args_: PromptFilterLinesArgs = { search_type: 'regex', invert_search: false };
      vscode.commands.executeCommand('filterlines.promptFilterLines', args_);
    })),
    vscode.commands.registerTextEditorCommand('filterlines.includeLinesWithString', catchErrors((editor, edit, args) => {
      const args_: PromptFilterLinesArgs = { search_type: 'string', invert_search: false };
      vscode.commands.executeCommand('filterlines.promptFilterLines', args_ );
    })),
    vscode.commands.registerTextEditorCommand('filterlines.excludeLinesWithRegex', catchErrors((editor, edit, args) => {
      const args_: PromptFilterLinesArgs = { search_type: 'regex', invert_search: true };
      vscode.commands.executeCommand('filterlines.promptFilterLines', args_);
    })),
    vscode.commands.registerTextEditorCommand('filterlines.excludeLinesWithString', catchErrors((editor, edit, args) => {
      const args_: PromptFilterLinesArgs = { search_type: 'string', invert_search: true };
      vscode.commands.executeCommand('filterlines.promptFilterLines', args_ );
    })),
    vscode.commands.registerTextEditorCommand('filterlines.includeLinesWithRegexAndContext', catchErrors((editor, edit, args) => {
      const args_: PromptFilterLinesArgs = { search_type: 'regex', invert_search: false, with_context: true };
      vscode.commands.executeCommand('filterlines.promptFilterLines', args_);
    })),
    vscode.commands.registerTextEditorCommand('filterlines.includeLinesWithStringAndContext', catchErrors((editor, edit, args) => {
      const args_: PromptFilterLinesArgs = { search_type: 'string', invert_search: false, with_context: true };
      vscode.commands.executeCommand('filterlines.promptFilterLines', args_ );
    })),
    vscode.commands.registerTextEditorCommand('filterlines.excludeLinesWithRegexAndContext', catchErrors((editor, edit, args) => {
      const args_: PromptFilterLinesArgs = { search_type: 'regex', invert_search: true, with_context: true };
      vscode.commands.executeCommand('filterlines.promptFilterLines', args_);
    })),
    vscode.commands.registerTextEditorCommand('filterlines.excludeLinesWithStringAndContext', catchErrors((editor, edit, args) => {
      const args_: PromptFilterLinesArgs = { search_type: 'string', invert_search: true, with_context: true };
      vscode.commands.executeCommand('filterlines.promptFilterLines', args_ );
    })),

    vscode.commands.registerTextEditorCommand('filterlines.promptFilterLines', catchErrors((editor, edit, args) => {
      const {
        search_type = 'regex',
        invert_search = false,
        with_context = false,
        context = null,
        before_context = null,
        after_context = null,
      } = args as PromptFilterLinesArgs || {};
      promptFilterLines(editor, edit, search_type, invert_search, with_context, context, before_context, after_context).then();
    })),

    vscode.commands.registerTextEditorCommand('filterlines.filterLines', catchErrors((editor, edit, args) => {
      const {
        search_type = 'regex',
        invert_search = false,
        needle = '',
        context = null,
        before_context = null,
        after_context = null,
      } = args as FilterLinesArgs || {};
      filterLines(editor, edit, needle, search_type, invert_search, context, before_context, after_context);
    })),
  );
}


async function promptFilterLines(
  editor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
  searchType: SearchType,
  invertSearch: boolean,
  withContext: boolean,
  context: number|null,
  beforeContext: number|null,
  afterContext: number|null,
): Promise<void> {
  const config = DI.getConfiguration();
  let contextString: string | undefined;

  if (withContext) {
    contextString = await promptForContext(config);
    if (contextString == null)
      return;

    try {
      [beforeContext, afterContext] = parseContext(contextString);
    }
    catch {
      await vscode.window.showErrorMessage('Expected a single or two non-negative numbers separated with ":" (<context> or <before_context>:<after_context>)');
      return;
    }
  }

  const searchText = await promptForSearchText(editor, config, searchType, invertSearch);
  if (searchText == null)
    return;

  if (config.preserveSearch) {
    STORAGE.latestSearch = searchText;
    if (contextString != null)
      STORAGE.latestContext = contextString;
  }

  const args: FilterLinesArgs = {
    search_type: searchType,
    invert_search: invertSearch,
    needle: searchText,
    context: context,
    before_context: beforeContext,
    after_context: afterContext,
  };
  vscode.commands.executeCommand('filterlines.filterLines', args);
}

function promptForSearchText(editor: vscode.TextEditor, config: Readonly<ExtensionSettings>, searchType: SearchType, invertSearch: boolean): Thenable<string|undefined> {
  const prompt = `Filter to lines ${invertSearch ? 'not ' : ''}${searchType === 'string' ? 'containing' : 'matching'}: `;

  let searchText = config.preserveSearch ? STORAGE.latestSearch : '';
  if (!searchText) {
    // Use word under cursor
    const wordRange = editor.document.getWordRangeAtPosition(editor.selection.active);
    if (wordRange)
      searchText = editor.document.getText(wordRange);
  }

  return vscode.window.showInputBox({
    prompt,
    value: searchText,
  });
}

function promptForContext(config: Readonly<ExtensionSettings>): Thenable<string|undefined> {
  const contextString = config.preserveSearch ? STORAGE.latestContext : '';

  return vscode.window.showInputBox({
    prompt: 'Context',
    value: contextString,
  });
}

const RE_SINGLE_NUMBER = /^\s*(\d+)\s*$/;
const RE_TWO_NUMBERS = /^\s*(\d+)\s*:\s*(\d+)\s*$/;

function parseContext(contextString: string): [number, number] {
  let match = RE_SINGLE_NUMBER.exec(contextString);
  if (match) {
    const context = parseInt(match[1], 10);
    return [context, context];
  }

  match = RE_TWO_NUMBERS.exec(contextString);
  if (match) {
    const beforeContext = parseInt(match[1], 10);
    const afterContext = parseInt(match[2], 10);
    return [beforeContext, afterContext];
  }

  throw new Error(`Invalid context string: '${contextString}'`);
}

function filterLines(
  editor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
  searchText: string,
  searchType: SearchType,
  invertSearch: boolean,
  context: number|null,
  beforeContext: number|null,
  afterContext: number|null,
): void {
  if (context == null) context = 0;
  if (beforeContext == null) beforeContext = context;
  if (afterContext == null) afterContext = context;

  const config = DI.getConfiguration();

  const re = constructSearchRegExp(searchText, searchType, config);

  const matchingLines: number[] = [];
  for (let lineno = 0; lineno < editor.document.lineCount; ++lineno) {
    const lineText = editor.document.lineAt(lineno).text;
    if (re.test(lineText) !== invertSearch) {
      const start = Math.max(lineno - beforeContext, matchingLines.length > 0 ? matchingLines[matchingLines.length - 1] + 1 : 0);
      const end = Math.min(lineno + afterContext + 1, editor.document.lineCount);
      for (let i = start; i < end; ++i)
        matchingLines.push(i);
    }
  }

  // Showing filtered output in a new tab
  if (config.createNewTab) {
    const content: string[] = [];
    for (const lineno of matchingLines) {
      const lineText = editor.document.lineAt(lineno).text;
      if (config.lineNumbers)
        content.push(formatLineNumber(lineno));
      content.push(lineText);
      content.push('\n');
    }
    if (content.length)
      --content.length;  // remove trailing newline
    vscode.workspace.openTextDocument({ language: editor.document.languageId, content: content.join('') }).then(doc => {
      vscode.window.showTextDocument(doc);
    });
  }

  // In-place filtering
  else {
    let lineno = editor.document.lineCount - 1;
    while (matchingLines.length > 0) {
      const matchingLine = matchingLines.pop()!;
      while (lineno > matchingLine) {
        const line = editor.document.lineAt(lineno);
        edit.delete(line.rangeIncludingLineBreak);
        --lineno;
      }
      // Insert line number
      if (config.lineNumbers) {
        const line = editor.document.lineAt(lineno);
        edit.insert(line.range.start, formatLineNumber(lineno));
      }
      --lineno;
    }
    while (lineno >= 0) {
      const line = editor.document.lineAt(lineno);
      edit.delete(line.rangeIncludingLineBreak);
      --lineno;
    }
  }
}

function constructSearchRegExp(searchText: string, searchType: SearchType, config: Readonly<ExtensionSettings>): RegExp {
  let flags = '';
  if (searchType === 'string') {
    searchText = escapeRegexp(searchText);
    if (!config.caseSensitiveStringSearch)
      flags += 'i';
  }
  else {
    if (!config.caseSensitiveRegexSearch)
      flags += 'i';
  }
  return new RegExp(searchText, flags);
}

function formatLineNumber(lineno: number): string {
  return `${String(lineno).padStart(5)}: `;
}
