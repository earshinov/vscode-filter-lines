import assert from 'assert';
import vscode from 'vscode';

import { MORE_NUMBERS } from './test-data';
import { REGISTRY } from './test-di';
import { setEditorText, invokeFilterLinesWithContext, trimmed, getEditorsCount } from './test-utils';


suite('Indented context', () => {

  setup(() => {
    REGISTRY.updateSettings({ indentContext: true });
  });

  test('basic with context as a single number', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '1');
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      2
        1
        2
        2
      2
        2
        2
        2
      2
        2
        2
        3
      2
        6
        2
        4
    `));
  });

  test('with separate leading and trailing context', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '1:0');
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      2
        1
        2
      2
        2
        2
      2
        2
        2
      2
        6
        2
    `));

    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '0:1');
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      2
        2
        2
      2
        2
        2
      2
        2
        3
      2
        2
        4
    `));
  });

  test('with overlapping context lines', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '4', '2');
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      4
        2
        3
        4
        5
        6
      4
        6
        2
        4
    `));
  });

  test('without context', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '');
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      2
      2
      2
      2
    `));
  });

  test('with inverted search', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.excludeLinesWithRegexAndContext', '[23]', '1');
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      0
        0
        1
      1
        0
        1
        2
      4
        3
        4
        5
      5
        4
        5
        6
      6
        5
        6
        2
      4
        2
        4
    `));
  });

  // #region Line numbers

  test('with line numbers', async () => {
    REGISTRY.updateSettings({ lineNumbers: true });

    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '1');
    // Line numbers should be padded to 5 chars with spaces
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      |    3: 2
      |      2: 1
      |      3: 2
      |      4: 2
      |    4: 2
      |      3: 2
      |      4: 2
      |      5: 2
      |    5: 2
      |      4: 2
      |      5: 2
      |      6: 3
      |   10: 2
      |      9: 6
      |     10: 2
      |     11: 4
    `));
  });

  test('with line numbers and inverted search', async () => {
    REGISTRY.updateSettings({ lineNumbers: true });

    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.excludeLinesWithRegexAndContext', '[23]', '1');
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      |    1: 0
      |      1: 0
      |      2: 1
      |    2: 1
      |      1: 0
      |      2: 1
      |      3: 2
      |    7: 4
      |      6: 3
      |      7: 4
      |      8: 5
      |    8: 5
      |      7: 4
      |      8: 5
      |      9: 6
      |    9: 6
      |      8: 5
      |      9: 6
      |     10: 2
      |   11: 4
      |     10: 2
      |     11: 4
    `));
  });

  // #endregion

  // #region New tab

  test('in new tab', async () => {
    REGISTRY.updateSettings({ createNewTab: true });

    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '1');

    assert.equal(getEditorsCount(), 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      2
        1
        2
        2
      2
        2
        2
        2
      2
        2
        2
        3
      2
        6
        2
        4
    `));
  });

  test('in new tab without context', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '');
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      2
      2
      2
      2
    `));
  });

  test('in new tab with inverted search', async () => {
    REGISTRY.updateSettings({ createNewTab: true });

    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.excludeLinesWithRegexAndContext', '[23]', '1');

    assert.equal(getEditorsCount(), 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      0
        0
        1
      1
        0
        1
        2
      4
        3
        4
        5
      5
        4
        5
        6
      6
        5
        6
        2
      4
        2
        4
    `));
  });

  test('in new tab with line numbers', async () => {
    REGISTRY.updateSettings({ createNewTab: true, lineNumbers: true });

    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '1');

    assert.equal(getEditorsCount(), 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      |    3: 2
      |      2: 1
      |      3: 2
      |      4: 2
      |    4: 2
      |      3: 2
      |      4: 2
      |      5: 2
      |    5: 2
      |      4: 2
      |      5: 2
      |      6: 3
      |   10: 2
      |      9: 6
      |     10: 2
      |     11: 4
    `));
  });

  test('in new tab with line numbers and inverted search', async () => {
    REGISTRY.updateSettings({ createNewTab: true, lineNumbers: true });

    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.excludeLinesWithRegexAndContext', '[23]', '1');

    assert.equal(getEditorsCount(), 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      |    1: 0
      |      1: 0
      |      2: 1
      |    2: 1
      |      1: 0
      |      2: 1
      |      3: 2
      |    7: 4
      |      6: 3
      |      7: 4
      |      8: 5
      |    8: 5
      |      7: 4
      |      8: 5
      |      9: 6
      |    9: 6
      |      8: 5
      |      9: 6
      |     10: 2
      |   11: 4
      |     10: 2
      |     11: 4
    `));
  });

  // #endregion
});
