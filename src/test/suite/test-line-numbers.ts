import assert from 'assert';
import vscode from 'vscode';

import { NUMBERS } from './test-data';
import { REGISTRY } from './test-di';
import { setEditorText, invokeFilterLines, trimmed } from './test-utils';


suite('Line numbers', async () => {

  test('Line numbers', async () => {
    REGISTRY.updateSettings({ lineNumbers: true });

    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);
    await invokeFilterLines('filterlines.includeLinesWithString', '2');
    // Line numbers should be padded to 5 chars with spaces
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      |    2: 2
      |    4: 2
    `));
  });

  test('Line numbers with inverted search', async () => {
    REGISTRY.updateSettings({ lineNumbers: true });

    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);
    await invokeFilterLines('filterlines.excludeLinesWithString', '2');
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      |    1: 1
      |    3: 3
      |    5: 4
    `));
  });
});
