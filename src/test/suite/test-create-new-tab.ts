import assert from 'assert';
import vscode from 'vscode';

import { NUMBERS } from './test-data';
import { REGISTRY } from './test-di';
import { setEditorText, invokeFilterLines, trimmed } from './test-utils';


suite('New tab', async () => {

  test('New tab', async () => {
    REGISTRY.updateSettings({ createNewTab: true });

    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);
    await invokeFilterLines('filterlines.includeLinesWithString', '2');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText(), '2\n2\n');
  });

  test('New tab with inverted search', async () => {
    REGISTRY.updateSettings({ createNewTab: true });

    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);
    await invokeFilterLines('filterlines.excludeLinesWithString', '2');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText(), '1\n3\n4\n');
  });

  test('New tab with line numbers', async () => {
    REGISTRY.updateSettings({ createNewTab: true, lineNumbers: true });

    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);
    await invokeFilterLines('filterlines.includeLinesWithString', '2');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      |    2: 2
      |    4: 2
    `));
  });

  test('New tab with inverted search and line numbers', async () => {
    REGISTRY.updateSettings({ createNewTab: true, lineNumbers: true });

    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);
    await invokeFilterLines('filterlines.excludeLinesWithString', '2');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      |    1: 1
      |    3: 3
      |    5: 4
    `));
  });
});
