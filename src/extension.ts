import vscode from 'vscode';

import { escapeRegexp, catchErrors } from './utils';
import { IDependencyRegistry, ExtensionSettings, DependencyRegistry } from './di';
import { IConfiguration } from './configuration';


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


export const DI = {

  getRegistry(context: vscode.ExtensionContext): IDependencyRegistry {
    return new DependencyRegistry(context);
  }
};


export function activate(this: void, extensionContext: vscode.ExtensionContext) {

  extensionContext.subscriptions.push(

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
      const registry = DI.getRegistry(extensionContext);
      promptFilterLines(registry, editor, edit, search_type, invert_search, with_context, context, before_context, after_context).then();
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
      const registry = DI.getRegistry(extensionContext);
      filterLines(registry, editor, edit, needle, search_type, invert_search, context, before_context, after_context);
    })),
  );
}


async function promptFilterLines(
  registry: IDependencyRegistry,
  editor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
  searchType: SearchType,
  invertSearch: boolean,
  withContext: boolean,
  context: number|null,
  beforeContext: number|null,
  afterContext: number|null,
): Promise<void> {

  const searchText = await promptForSearchText(registry, editor, searchType, invertSearch);
  if (searchText == null)
    return;

  let contextString: string | undefined;
  if (withContext) {
    contextString = await promptForContext(registry);
    if (contextString == null)
      return;

    try {
      [beforeContext, afterContext] = parseContext(contextString);
    }
    catch {
      await vscode.window.showErrorMessage('Expected a single number or before_context:after_context');
      return;
    }
  }

  if (registry.configuration.get('preserveSearch'))
    registry.searchStorage.set('latestSearch', searchText);
  // Store last used context irrespective of the preserveSearch setting
  if (contextString != null)
    registry.contextStorage.set('latestContext', contextString);

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

function promptForSearchText(registry: IDependencyRegistry, editor: vscode.TextEditor, searchType: SearchType, invertSearch: boolean): Thenable<string|undefined> {
  const prompt = `Filter to lines ${invertSearch ? 'not ' : ''}${searchType === 'string' ? 'containing' : 'matching'}: `;

  let searchText = registry.configuration.get('preserveSearch') ? registry.searchStorage.get('latestSearch') : '';
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

function promptForContext(registry: IDependencyRegistry): Thenable<string|undefined> {
  return vscode.window.showInputBox({
    prompt: 'Context (a single number or before_context:after_context)',
    value: registry.contextStorage.get('latestContext'),
  });
}

const RE_SINGLE_NUMBER = /^\s*(\d+)\s*$/;
const RE_TWO_NUMBERS = /^\s*(\d+)\s*:\s*(\d+)\s*$/;
const RE_SPACES = /^\s*$/;

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

  match = RE_SPACES.exec(contextString);
  if (match) {
    const context = 0;
    return [context, context];
  }

  throw new Error(`Invalid context string: '${contextString}'`);
}

function filterLines(
  registry: IDependencyRegistry,
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

  const config = registry.configuration;
  const lineNumbers = config.get('lineNumbers');
  const indentContext = config.get('indentContext');
  const contextIndentation = indentContext ? getIndentation(editor) : null;

  const re = constructSearchRegExp(config, searchText, searchType);

  const matchingLines: number[] = [];
  for (let lineno = 0; lineno < editor.document.lineCount; ++lineno) {
    const lineText = editor.document.lineAt(lineno).text;
    if (re.test(lineText) !== invertSearch) {
      if (!indentContext) {
        // Put context lines into `matchingLines`
        const min = matchingLines.length > 0 ? matchingLines[matchingLines.length - 1] + 1 : 0;
        const [start, end] = linesWithContext(editor.document, lineno, beforeContext, afterContext, min);
        for (let i = start; i < end; ++i)
          matchingLines.push(i);
      }
      else {
        // Context lines will be handled separately
        matchingLines.push(lineno);
      }
    }
  }

  // Showing filtered output in a new tab
  if (config.get('createNewTab')) {
    const content: string[] = [];
    for (const lineno of matchingLines) {
      formatLine(editor, lineno, null, lineNumbers, content);
      content.push('\n');
      if (indentContext) {
        const [start, end] = linesWithContext(editor.document, lineno, beforeContext, afterContext);
        if (end - start > 1)
          for (let i = start; i < end; ++i) {
            formatLine(editor, i, contextIndentation, lineNumbers, content);
            content.push('\n');
          }
      }
    }
    vscode.workspace.openTextDocument({ language: editor.document.languageId, content: content.join('') }).then(doc => {
      vscode.window.showTextDocument(doc);

      if (indentContext && config.get('foldIndentedContext'))
        vscode.commands.executeCommand('editor.foldAll');
    });
  }

  // In-place filtering
  else {
    const eol = editor.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';

    let lineno = editor.document.lineCount - 1;
    while (matchingLines.length > 0) {
      const matchingLine = matchingLines.pop()!;
      while (lineno > matchingLine) {
        const line = editor.document.lineAt(lineno);
        edit.delete(line.rangeIncludingLineBreak);
        --lineno;
      }
      const line = editor.document.lineAt(lineno);

      // Insert context
      if (indentContext) {
        const [start, end] = linesWithContext(editor.document, lineno, beforeContext, afterContext);
        if (end - start > 1) {
          const content: string[] = [];
          for (let i = start; i < end; ++i) {
            content.push(eol);
            formatLine(editor, i, contextIndentation, lineNumbers, content);
          }
          edit.insert(line.range.end, content.join(''));
        }
      }

      // Insert line number
      if (lineNumbers)
        edit.insert(line.range.start, formatLineNumber(lineno));

      --lineno;
    }
    while (lineno >= 0) {
      const line = editor.document.lineAt(lineno);
      edit.delete(line.rangeIncludingLineBreak);
      --lineno;
    }

    if (indentContext && config.get('foldIndentedContext'))
        vscode.commands.executeCommand('editor.foldLevel1');
  }
}

function constructSearchRegExp(config: IConfiguration<ExtensionSettings>, searchText: string, searchType: SearchType): RegExp {
  let flags = '';
  if (searchType === 'string') {
    searchText = escapeRegexp(searchText);
    if (!config.get('caseSensitiveStringSearch'))
      flags += 'i';
  }
  else {
    if (!config.get('caseSensitiveRegexSearch'))
      flags += 'i';
  }
  return new RegExp(searchText, flags);
}

function linesWithContext(document: vscode.TextDocument, lineno: number, beforeContext: number, afterContext: number, min = 0): [number, number] {
  const start = Math.max(lineno - beforeContext, min);
  const end = Math.min(lineno + afterContext + 1, document.lineCount);
  return [start, end];
}

function formatLine(editor: vscode.TextEditor, lineno: number, indentation: string | null, lineNumbers: boolean, acc: string[]): void {
  if (indentation)
    acc.push(indentation);
  if (lineNumbers)
    acc.push(formatLineNumber(lineno));
  acc.push(editor.document.lineAt(lineno).text);
}

function formatLineNumber(lineno: number): string {
  return `${String(lineno).padStart(5)}: `;
}

function getIndentation(editor: vscode.TextEditor): string {
  return editor.options.insertSpaces ? ' '.repeat(editor.options.tabSize as number) : '\t';
}
