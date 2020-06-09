import * as sinon from 'sinon';
import * as vscode from 'vscode';

import { ExtensionSettings, DEFAULT_CONFIGURATION } from '../../../extension';
import { escapeRegexp } from '../../../utils';

export { trimmed } from './trimmed';


/**
 * Get a selection range spanning the whole document
 */
function getWholeDocumentRange(document: vscode.TextDocument): vscode.Range {
  const firstLine = document.lineAt(0);
  const lastLine = document.lineAt(document.lineCount - 1);
  return new vscode.Range(firstLine.range.start, lastLine.range.end);
}


/**
 * Set editor text
 */
export function setEditorText(editor: vscode.TextEditor, edit: vscode.TextEditorEdit, text: string): void;
export function setEditorText(editor: vscode.TextEditor, text: string): Thenable<void>;
export function setEditorText(editor: vscode.TextEditor, editOrText: vscode.TextEditorEdit|string, optionalText?: string): void | Thenable<void> {
  if (typeof editOrText === 'string') {
    const text = editOrText;
    return editor.edit(edit => {
      setEditorText(editor, edit, text);
    }).then(() => {});
  }
  else {
    const edit = editOrText;
    const text = optionalText!;
    edit.replace(getWholeDocumentRange(editor.document), text);
  }
}


/**
 * Run the given callback with emulated `vscode.window.showInputBox`
 *
 * @param options Expected options of `vscode.window.showInputBox`
 * @param searchText Text to enter into the emulated input box
 * @param cb
 */
export async function withInputBox(options: sinon.SinonMatcher, searchText: string | undefined, cb: () => void | Thenable<void>): Promise<void> {
  const showInputBox = sinon.stub(vscode.window, 'showInputBox');
  try {
    showInputBox.resolves(searchText);

    await cb();

    sinon.assert.calledOnce(showInputBox);
    sinon.assert.calledWith(showInputBox, options);
  }
  finally {
    showInputBox.restore();
  }
}

/**
 * Call this method after invoking the extension to wait until the extension finishes its work.
 *
 * The fact that the extension uses `vscode.commands.executeCommand` inside seems to cause race conditions
 * between the extension and the extension host running somewhere inside VS Code.  Somehow they get different
 * idea of the active text editor, and the extension host rejects the request to execute a command because,
 * in its opinion, there is no active text editor.
 *
 * The extension can't do without `vscode.commands.executeCommand` inside, because due to the use of an
 * interactive input box the extension's code is asynchronous, and the `edit` object is only valid during
 * command callback execution.
 *
 * Change 200ms to something less like 10ms to watch tests fail.
 */
function untilStable(): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 200);
  });
}

export type ExtensionCommand =
  'filterlines.includeLinesWithRegex' |
  'filterlines.includeLinesWithString' |
  'filterlines.excludeLinesWithRegex' |
  'filterlines.excludeLinesWithString';

/**
 * Invoke the FilterLines extension
 */
export async function invokeExtension(command: ExtensionCommand, searchText: string | undefined): Promise<void>;
export async function invokeExtension(command: ExtensionCommand, inputBoxOptions: sinon.SinonMatcher, searchText: string | undefined): Promise<void>;
export async function invokeExtension(command: ExtensionCommand, inputBoxOptionsOrSearchText: sinon.SinonMatcher | string | undefined, optionalSearchText?: string | undefined): Promise<void> {
  let inputBoxOptions: sinon.SinonMatcher;
  let searchText: string | undefined;
  if (typeof inputBoxOptionsOrSearchText === 'string' || inputBoxOptionsOrSearchText === undefined) {
    inputBoxOptions = sinon.match.any;
    searchText = inputBoxOptionsOrSearchText;
  }
  else {
    inputBoxOptions = inputBoxOptionsOrSearchText;
    searchText = optionalSearchText;
  }

  await withInputBox(inputBoxOptions, searchText, async () => {
    await vscode.commands.executeCommand(command);
    if (searchText != null)
      await untilStable();
  });
}


/**
 * Fake configuration to be injected into DI.getConfiguration when testing.
 */
export const FAKE_CONFIGURATION: ExtensionSettings = { ...DEFAULT_CONFIGURATION };

/**
 * Reset the fake configuration to extension defaults.
 */
export function resetConfiguration() {
  const settings = FAKE_CONFIGURATION;
  for (const _key in settings)
    if (settings.hasOwnProperty(_key)) {
      const key = _key as keyof ExtensionSettings;
      settings[key] = DEFAULT_CONFIGURATION[key];
    }
}

/**
 * Updates the fake configuration.
 *
 * @example Update a configuration value:
 * ```typescript
 * updateConfiguration({ preserveSearch: true });
 * ```
 *
 * @example Clear a configuration value, effectively setting it to the default:
 * ```typescript
 * updateConfiguration({ preserveSearch: undefined });
 * ```
 *
 * Of course, you can update/clear multiple settings at once.
 */
export function updateConfiguration(settings: Partial<{[K in keyof ExtensionSettings]: ExtensionSettings[K]|undefined}>): void {
  for (const _key in settings)
    if (settings.hasOwnProperty(_key)) {
      const key = _key as keyof ExtensionSettings;
      const value = settings[key];
      FAKE_CONFIGURATION[key] = value !== undefined ? value : DEFAULT_CONFIGURATION[key];
    }
}


/**
 * Returns the document position specified by the search string `needle`.
 *
 * The search string is any string with '|' marker.
 *
 * For example, given a document with the following content:
 *
 *   abc
 *   def
 *
 * the call to `findPosition('de|f') will return Position(line=1, character=2).
 */
export function findPosition(document: vscode.TextDocument, needle: string): vscode.Position {
  const markerPos = needle.indexOf('|');
  if (markerPos < 0)
    throw new Error(`Expected the search string '${needle}' to contain marker '|'`);

  const position = findPositionRaw(document, needle.substring(0, markerPos) + needle.substring(markerPos + 1));
  return position.translate({ characterDelta: markerPos });
}

/**
 * Returns the position of the given search string in the document.
 */
export function findPositionRaw(document: vscode.TextDocument, needle: string): vscode.Position {
  // Compile the search string to regexp for hopefully better performance.
  const re = new RegExp(escapeRegexp(needle), 'g');

  for (let lineno = 0; lineno < document.lineCount; ++lineno) {
    const line = document.lineAt(lineno);
    const text = document.getText(line.range);
    const match = re.exec(text);
    if (match)
      return new vscode.Position(lineno, match.index);
  }

  throw new Error(`Not found: ${needle}`);
}


/**
 * Close the active editor
 */
export async function closeEditor() {
  await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
}

/**
 * Open a new blank editor
 */
export async function openEditor(): Promise<vscode.TextEditor> {
  const doc = await vscode.workspace.openTextDocument();
  const editor = await vscode.window.showTextDocument(doc);
  return editor;
}

export async function reopenEditor(): Promise<vscode.TextEditor> {
  await closeEditor();
  const editor = await openEditor();
  return editor;
}
