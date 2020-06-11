import assert from 'assert';
import sinon from 'sinon';
import vscode from 'vscode';

import { NUMBERS } from './test-data';
import { setEditorText, invokeExtension } from './test-utils';


suite('Contributed commands', () => {

  test('"Include Lines With Regex"', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    await invokeExtension(
      'filterlines.includeLinesWithRegex',
      sinon.match({
        prompt: 'Filter to lines matching: ',
        value: sinon.match.any,
      }),
      '[23]');

    assert.equal(editor.document.getText(), '2\n3\n2\n');
  });

  test('"Include Lines With String"', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    await invokeExtension(
      'filterlines.includeLinesWithString',
      sinon.match({
        prompt: 'Filter to lines containing: ',
        value: sinon.match.any,
      }),
      '2');

    assert.equal(editor.document.getText(), '2\n2\n');
  });

  test('"Exclude Lines With Regex"', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    await invokeExtension(
      'filterlines.excludeLinesWithRegex',
      sinon.match({
        prompt: 'Filter to lines not matching: ',
        value: sinon.match.any,
      }),
      '[14]');

    assert.equal(editor.document.getText(), '2\n3\n2\n');
  });

  test('"Exclude Lines With String"', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    await invokeExtension(
      'filterlines.excludeLinesWithString',
      sinon.match({
        prompt: 'Filter to lines not containing: ',
        value: sinon.match.any,
      }),
      '2');

    assert.equal(editor.document.getText(), '1\n3\n4');
  });
});
