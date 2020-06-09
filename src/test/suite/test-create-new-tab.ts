import * as assert from 'assert';
import * as vscode from 'vscode';

import { NUMBERS } from './test-data';
import { setEditorText, updateConfiguration, invokeExtension, trimmed, closeEditor } from './test-utils';


suite('New tab', async () => {

  test('New tab', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    updateConfiguration({
      createNewTab: true,
    });

    await invokeExtension('filterlines.includeLinesWithString', '2');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText(), '2\n2');
    await closeEditor();
  });

  test('New tab with inverted search', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    updateConfiguration({
      createNewTab: true,
    });

    await invokeExtension('filterlines.excludeLinesWithString', '2');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText(), '1\n3\n4');
    await closeEditor();
  });

  test('New tab with line numbers', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    updateConfiguration({
      createNewTab: true,
      lineNumbers: true,
    });

    await invokeExtension('filterlines.includeLinesWithString', '2');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText(), trimmed(`
      |    1: 2
      |    3: 2
    `));
    await closeEditor();
  });

  test('New tab with inverted search and line numbers', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    updateConfiguration({
      createNewTab: true,
      lineNumbers: true,
    });

    await invokeExtension('filterlines.excludeLinesWithString', '2');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText(), trimmed(`
      |    0: 1
      |    2: 3
      |    4: 4
    `));
    await closeEditor();
  });
});
