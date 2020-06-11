import assert from 'assert';
import vscode from 'vscode';

import { NUMBERS, MORE_NUMBERS } from './test-data';
import { setEditorText, updateConfiguration, invokeFilterLines, trimmed, invokeFilterLinesWithContext } from './test-utils';


suite('New tab', async () => {

  test('New tab', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    updateConfiguration({
      createNewTab: true,
    });

    await invokeFilterLines('filterlines.includeLinesWithString', '2');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText(), '2\n2');
  });

  test('New tab with inverted search', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    updateConfiguration({
      createNewTab: true,
    });

    await invokeFilterLines('filterlines.excludeLinesWithString', '2');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText(), '1\n3\n4');
  });

  test('New tab with line numbers', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    updateConfiguration({
      createNewTab: true,
      lineNumbers: true,
    });

    await invokeFilterLines('filterlines.includeLinesWithString', '2');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText(), trimmed(`
      |    1: 2
      |    3: 2
    `));
  });

  test('New tab with inverted search and line numbers', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    updateConfiguration({
      createNewTab: true,
      lineNumbers: true,
    });

    await invokeFilterLines('filterlines.excludeLinesWithString', '2');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText(), trimmed(`
      |    0: 1
      |    2: 3
      |    4: 4
    `));
  });

  test('New tab with context', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);

    updateConfiguration({
      createNewTab: true,
    });

    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '1', '2');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText(), '1\n2\n2\n2\n3\n6\n2\n4');
  });

  test('New tab with inverted search and context', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);

    updateConfiguration({
      createNewTab: true,
    });

    await invokeFilterLinesWithContext('filterlines.excludeLinesWithStringAndContext', '1', '2');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText(), '0\n1\n2\n2\n3\n4\n5\n6\n2\n4');
  });

  test('New tab with line numbers and context', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);

    updateConfiguration({
      createNewTab: true,
      lineNumbers: true,
    });

    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '1', '2');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText(), trimmed(`
      |    1: 1
      |    2: 2
      |    3: 2
      |    4: 2
      |    5: 3
      |    8: 6
      |    9: 2
      |   10: 4
    `));
  });

  test('New tab with inverted search and line numbers and context', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);

    updateConfiguration({
      createNewTab: true,
      lineNumbers: true,
    });

    await invokeFilterLinesWithContext('filterlines.excludeLinesWithStringAndContext', '1', '2');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText(), trimmed(`
      |    0: 0
      |    1: 1
      |    2: 2
      |    4: 2
      |    5: 3
      |    6: 4
      |    7: 5
      |    8: 6
      |    9: 2
      |   10: 4
    `));
  });
});
