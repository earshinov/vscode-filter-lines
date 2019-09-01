import * as vscode from 'vscode';

import { escapeRegexp, catchErrors } from './utils';


type SearchType = 'string'|'regex';

interface PromptFilterLinesArgs {
  search_type?: SearchType;
  invert_search?: boolean;
}

interface FilterLinesArgs {
  search_type?: SearchType;
  invert_search?: boolean;
  needle: string;
}


class Configuration {

  private config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration('filterlines');
  }

  get caseSensitiveStringSearch() { return this.config.get<boolean>('caseSensitiveStringSearch', false); }
  get caseSensitiveRegexSearch() { return this.config.get<boolean>('caseSensitiveRegexSearch', true); }
  get preserveSearch() { return this.config.get<boolean>('preserveSearch', true); }
  get lineNumbers() { return this.config.get<boolean>('lineNumbers', false); }
  get createNewTab() { return this.config.get<boolean>('createNewTab', true); }
}


class Storage {

  latestSearch = '';
}


export function activate(this: void, context: vscode.ExtensionContext) {

  context.subscriptions.push(

    // Provide wrapper commands to be bound in package.json > "contributes" > "commands".
    // If one command is bound several times with different "args", VS Code only displays the last entry in the Ctrl-Shift-P menu.
    vscode.commands.registerTextEditorCommand('filterlines.includeLinesWithRegex', catchErrors((editor, edit, args) => {
      const args_: PromptFilterLinesArgs = { 'search_type': 'regex', 'invert_search': false };
      vscode.commands.executeCommand('filterlines.promptFilterLines', args_);
    })),
    vscode.commands.registerTextEditorCommand('filterlines.includeLinesWithString', catchErrors((editor, edit, args) => {
      const args_: PromptFilterLinesArgs = { 'search_type': 'string', 'invert_search': false };
      vscode.commands.executeCommand('filterlines.promptFilterLines', args_ );
    })),
    vscode.commands.registerTextEditorCommand('filterlines.excludeLinesWithRegex', catchErrors((editor, edit, args) => {
      const args_: PromptFilterLinesArgs = { 'search_type': 'regex', 'invert_search': true };
      vscode.commands.executeCommand('filterlines.promptFilterLines', args_);
    })),
    vscode.commands.registerTextEditorCommand('filterlines.excludeLinesWithString', catchErrors((editor, edit, args) => {
      const args_: PromptFilterLinesArgs = { 'search_type': 'string', 'invert_search': true };
      vscode.commands.executeCommand('filterlines.promptFilterLines', args_ );
    })),

    vscode.commands.registerTextEditorCommand('filterlines.promptFilterLines', catchErrors((editor, edit, args) => {
      const { search_type = 'regex', invert_search = false } = args as PromptFilterLinesArgs || {};
      promptFilterLines(editor, edit, search_type, invert_search);
    })),

    vscode.commands.registerTextEditorCommand('filterlines.filterLines', catchErrors((editor, edit, args) => {
      const { search_type = 'regex', invert_search = false, needle = '' } = args as FilterLinesArgs || {};
      filterLines(editor, edit, needle, search_type, invert_search);
    })),
  );
}


function promptFilterLines(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, searchType: SearchType, invertSearch: boolean): void {
  const config = new Configuration();
  const storage = new Storage();

  const prompt = `Filter to lines ${invertSearch ? 'not ' : ''}${searchType === 'string' ? 'containing' : 'matching'}: `;
  let searchText = config.preserveSearch ? storage.latestSearch : '';
  if (!searchText) {
    // Use word under cursor
    const wordRange = editor.document.getWordRangeAtPosition(editor.selection.active);
    if (wordRange)
      searchText = editor.document.getText(wordRange);
  }

  vscode.window.showInputBox({
    prompt,
    value: searchText,
  }).then(searchText => {
    if (searchText !== undefined) {
      if (config.preserveSearch)
        storage.latestSearch = searchText;
      const args: FilterLinesArgs = {
        search_type: searchType,
        invert_search: invertSearch,
        needle: searchText,
      };
      vscode.commands.executeCommand('filterlines.filterLines', args);
    }
  });
}

function filterLines(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, searchText: string, searchType: SearchType, invertSearch: boolean): void {
  const config = new Configuration();

  const re = constructSearchRegExp(searchText, searchType, config);

  // Showing filtered output in a new tab
  if (config.createNewTab) {
    const content: string[] = [];
    for (let lineno = 0; lineno < editor.document.lineCount; ++lineno) {
      const lineText = editor.document.lineAt(lineno).text;
      if (re.test(lineText) !== invertSearch) {
        if (config.lineNumbers)
          content.push(formatLineNumber(lineno));
        content.push(lineText);
        content.push('\n');
      }
    }
    if (content.length)
      --content.length;  // remove trailing newline
    vscode.workspace.openTextDocument({ language: editor.document.languageId, content: content.join('') }).then(doc => {
      vscode.window.showTextDocument(doc);
    });
  }

  // In-place filtering
  else {
    for (let lineno = editor.document.lineCount - 1; lineno >= 0; --lineno) {
      const line = editor.document.lineAt(lineno);
      const lineText = line.text;
      if (re.test(lineText) !== invertSearch) {
        // Insert line number
        if (config.lineNumbers)
          edit.insert(line.range.start, formatLineNumber(lineno));
      }
      else
        edit.delete(line.rangeIncludingLineBreak);
    }
  }
}

function constructSearchRegExp(searchText: string, searchType: SearchType, config: Configuration): RegExp {
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
