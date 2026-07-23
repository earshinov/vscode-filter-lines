import vscode from 'vscode';

import { catchErrors } from './utils';
import {
  FilterParams,
  OutputMode,
  SearchType,
  buildFilteredContent,
  computeFoldRanges,
  computeMatchingLines,
  constructSearchRegExp,
  expandWithContext,
} from './filter';
import { ExtensionToWebview, FormState, WebviewToExtension } from './messages';


const STATE_KEY = 'filterLines.formState';

export const DEFAULT_STATE: Readonly<FormState> = {
  needle: '',
  caseSensitive: false,
  useRegex: true,
  action: 'include',
  outputMode: 'newtab',
  context: 0,
  lineNumbers: false,
  history: [],
};


/** Remembers the last active text editor so filtering still targets it while the sidebar view is focused. */
let lastEditor: vscode.TextEditor | undefined;

function getTargetEditor(): vscode.TextEditor | undefined {
  const active = vscode.window.activeTextEditor;
  if (active)
    return active;
  // The sidebar view can be focused while an editor is still open, so fall back to the last
  // active editor — but only if its tab is still open. `lastEditor` isn't cleared when all
  // editors close (onDidChangeActiveTextEditor(undefined) is ignored), so validate it against
  // the currently visible editors; otherwise we'd filter a stale/closed document into a new tab.
  if (lastEditor) {
    const stillOpen = vscode.window.visibleTextEditors.find((e) => e.document === lastEditor!.document);
    if (stillOpen)
      return stillOpen;
  }
  return undefined;
}


export function activate(this: void, context: vscode.ExtensionContext) {
  lastEditor = vscode.window.activeTextEditor;

  const provider = new FilterLinesViewProvider(context);

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor)
        lastEditor = editor;
    }),

    // retainContextWhenHidden keeps the webview alive while collapsed/hidden, so switching
    // views doesn't reload and flash the form.
    vscode.window.registerWebviewViewProvider(FilterLinesViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),

    // Programmatic entry point (also usable from keybindings). Returns the runFilter promise
    // so callers (and tests) awaiting the command wait for filtering to finish.
    vscode.commands.registerCommand('filterlines.filterLines', catchErrors((args: Partial<FilterLinesArgs> | undefined) => {
      const params = argsToParams(args || {});
      const editor = getTargetEditor();
      if (!editor) {
        vscode.window.showInformationMessage('Filter Lines: open a file to filter first.');
        return undefined;
      }
      return runFilter(editor, params);
    })),
  );
}

/* istanbul ignore next: nothing to clean up */
export function deactivate() { /* nothing to clean up */ }


interface FilterLinesArgs {
  search_type: SearchType;
  invert_search: boolean;
  needle: string;
  case_sensitive: boolean;
  context: number;
  output_mode: OutputMode;
  line_numbers: boolean;
}

function argsToParams(args: Partial<FilterLinesArgs>): FilterParams {
  return {
    searchType: args.search_type ?? 'regex',
    invertSearch: args.invert_search ?? false,
    needle: args.needle ?? '',
    caseSensitive: args.case_sensitive ?? false,
    context: Math.max(0, args.context ?? 0),
    outputMode: args.output_mode ?? 'newtab',
    lineNumbers: args.line_numbers ?? false,
  };
}

function stateToParams(state: FormState): FilterParams {
  return {
    searchType: state.useRegex ? 'regex' : 'string',
    invertSearch: state.action === 'exclude',
    needle: state.needle,
    caseSensitive: state.caseSensitive,
    context: Math.max(0, state.context | 0),
    outputMode: state.outputMode,
    lineNumbers: state.lineNumbers,
  };
}


// #region Filtering

export async function runFilter(
  editor: vscode.TextEditor,
  params: FilterParams,
  onInvalidNeedle?: (message: string) => void,
): Promise<void> {
  let re: RegExp;
  try {
    re = constructSearchRegExp(params.needle, params.searchType, params.caseSensitive);
  }
  catch (e) {
    const message = `Invalid regular expression: ${(e as Error).message}`;
    // The webview marks the search field invalid; the command path has no field, so notify.
    if (onInvalidNeedle)
      onInvalidNeedle(message);
    else
      await vscode.window.showErrorMessage(`Filter Lines: ${message}`);
    return;
  }

  const document = editor.document;
  const lines: string[] = [];
  for (let lineno = 0; lineno < document.lineCount; ++lineno)
    lines.push(document.lineAt(lineno).text);

  const matchingLines = computeMatchingLines(lines, re, params.invertSearch);
  const keptLines = expandWithContext(matchingLines, params.context, lines.length);

  switch (params.outputMode) {
    case 'fold':
      await applyFold(editor, keptLines, lines.length);
      return;
    case 'inplace':
      await applyInPlace(editor, lines, keptLines, params.lineNumbers);
      return;
    case 'newtab':
      await applyNewTab(editor, lines, keptLines, params.lineNumbers);
      return;
  }
}

async function applyNewTab(editor: vscode.TextEditor, lines: string[], keptLines: number[], lineNumbers: boolean): Promise<void> {
  const content = buildFilteredContent(lines, keptLines, lineNumbers);
  const doc = await vscode.workspace.openTextDocument({ language: editor.document.languageId, content });
  await vscode.window.showTextDocument(doc);
}

async function applyInPlace(editor: vscode.TextEditor, lines: string[], keptLines: number[], lineNumbers: boolean): Promise<void> {
  const content = buildFilteredContent(lines, keptLines, lineNumbers);
  const lastLine = editor.document.lineCount - 1;
  const fullRange = new vscode.Range(0, 0, lastLine, editor.document.lineAt(lastLine).text.length);
  await editor.edit((edit) => edit.replace(fullRange, content));
}

/**
 * Fold mode (issue #35): keep the whole file, fold away the non-matching runs.
 * Uses manual folding ranges created from a multi-selection, which is the only
 * reliable way to fold arbitrary line ranges through the VS Code API. Each range
 * is anchored under the preceding kept line (see `computeFoldRanges`).
 */
async function applyFold(editor: vscode.TextEditor, keptLines: number[], lineCount: number): Promise<void> {
  const ranges = computeFoldRanges(keptLines, lineCount);

  // Bring the target document to the foreground so folding commands act on it.
  const shown = await vscode.window.showTextDocument(editor.document, { viewColumn: editor.viewColumn, preserveFocus: false });

  // Clear folds from a previous run. removeManualFoldingRanges only affects ranges
  // intersecting the current selection, so select the whole document first to remove
  // all of them; otherwise stale folds from the last search would remain.
  const lastLine = shown.document.lineCount - 1;
  shown.selection = new vscode.Selection(0, 0, lastLine, shown.document.lineAt(lastLine).text.length);
  await vscode.commands.executeCommand('editor.removeManualFoldingRanges');
  await vscode.commands.executeCommand('editor.unfoldAll');
  if (ranges.length === 0) {
    shown.selection = new vscode.Selection(0, 0, 0, 0);
    return;
  }

  // End each selection at the full width of the last folded line. VS Code's
  // createFoldingRangeFromSelection trims a selection ending at column 0 back by
  // one line (its `endColumn === 1` heuristic), so ending at column 0 would leave
  // the last line of the run unfolded. Staying within `[header, end-1]` also keeps
  // selections from overlapping the next run's header.
  shown.selections = ranges.map(([header, end]) => {
    const lastLine = end - 1;
    const lastCol = shown.document.lineAt(lastLine).text.length;
    return new vscode.Selection(header, 0, lastLine, lastCol);
  });
  await vscode.commands.executeCommand('editor.createFoldingRangeFromSelection');
  shown.selection = new vscode.Selection(0, 0, 0, 0);
}

// #endregion


// #region Webview view

export class FilterLinesViewProvider implements vscode.WebviewViewProvider {

  static readonly viewType = 'filterLines.view';

  constructor(private readonly context: vscode.ExtensionContext) { }

  private get state(): FormState {
    return { ...DEFAULT_STATE, ...this.context.globalState.get<Partial<FormState>>(STATE_KEY) };
  }

  private save(state: FormState): void {
    this.context.globalState.update(STATE_KEY, state);
  }

  // @override
  resolveWebviewView(webviewView: vscode.WebviewView): void {
    const webview = webviewView.webview;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')],
    };
    webview.html = this.getHtml(webview);

    const post = (message: ExtensionToWebview) => webview.postMessage(message);

    webviewView.webview.onDidReceiveMessage(catchErrors((message: WebviewToExtension) => {
      switch (message.type) {
        case 'ready':
          post({ type: 'restore', state: this.state });
          return;
        case 'persist':
          this.save(message.state);
          return;
        case 'filter': {
          const state = message.state;
          this.save(state);
          const editor = getTargetEditor();
          if (!editor) {
            vscode.window.showInformationMessage('Filter Lines: open a file to filter first.');
            return;
          }
          runFilter(editor, stateToParams(state), (errorMessage) => {
            post({ type: 'invalid', message: errorMessage });
          }).then();
          return;
        }
      }
    }), undefined, this.context.subscriptions);
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.css'));
    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource}`,
      `script-src 'nonce-${nonce}'`,
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
  <title>Filter Lines</title>
</head>
<body>
  <div class="search">
    <div id="search-box" class="search--box">
      <input id="needle" type="text" class="search--input" placeholder="matching regex…" spellcheck="false" autocomplete="off">
    </div>
    <div class="search--toggles">
      <button id="toggle-case" class="search--toggle" title="Match Case">Aa</button>
      <button id="toggle-regex" class="search--toggle" title="Use Regular Expression">.*</button>
    </div>
    <input id="context" type="number" min="0" class="numberInput" value="0" title="Context Lines">
  </div>
  <div id="search-validation" class="searchValidation" hidden></div>
  <div id="history-hint" class="fieldHint">Use ↑ / ↓ for recent searches</div>

  <div class="formRow formRow-inline">
    <span class="fieldLabel">Action</span>
    <div class="buttonGroup" id="action" role="radiogroup">
      <button class="buttonGroup--button" data-value="include">Include</button>
      <button class="buttonGroup--button" data-value="exclude">Exclude</button>
    </div>
  </div>

  <div class="formRow formRow-inline">
    <span class="fieldLabel">Output</span>
    <div class="buttonGroup" id="output" role="radiogroup">
      <button class="buttonGroup--button" data-value="fold">Fold</button>
      <button class="buttonGroup--button" data-value="inplace">In-place</button>
      <button class="buttonGroup--button" data-value="newtab">New tab</button>
    </div>
  </div>

  <label class="formRow checkboxRow" id="line-numbers-row">
    <input id="line-numbers" type="checkbox">
    <span class="fieldLabel">Add line numbers</span>
  </label>

  <button id="filter" class="filterButton">Filter</button>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; ++i)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

// #endregion
