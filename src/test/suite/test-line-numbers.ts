import assert from 'assert';
import vscode from 'vscode';

import { NUMBERS } from './test-data';
import { setEditorText, updateConfiguration, invokeExtension, trimmed } from './test-utils';


suite('Line numbers', async () => {

  test('Line numbers', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    updateConfiguration({ lineNumbers: true });

    await invokeExtension('filterlines.includeLinesWithString', '2');
    // Line numbers should be padded to 5 chars with spaces
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      |    1: 2
      |    3: 2
    `));
  });

  test('Line numbers with inverted search', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    updateConfiguration({ lineNumbers: true });

    await invokeExtension('filterlines.excludeLinesWithString', '2');
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      |    0: 1
      |    2: 3
      |    4: 4
    `));
  });
});
