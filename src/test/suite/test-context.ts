import assert from 'assert';
import sinon from 'sinon';
import vscode from 'vscode';

import { MORE_NUMBERS } from './test-data';
import { setEditorText, invokeFilterLinesWithContext, withInputBox, untilStable } from './test-utils';


suite('Context', () => {

  test('Context can be specified as a single number', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '1', '2');
    assert.equal(editor.document.getText(), '1\n2\n2\n2\n3\n6\n2\n4');
  });

  test('Leading and trailing context can be specified separately', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '1:0', '2');
    assert.equal(editor.document.getText(), '1\n2\n2\n2\n6\n2\n');

    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '0:1', '2');
    assert.equal(editor.document.getText(), '2\n2\n2\n3\n2\n4');
  });

  test('Overlapping context lines are handled properly and not duplicated', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '4');
    assert.equal(editor.document.getText(), '2\n3\n4\n5\n6\n2\n4');

    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithRegexAndContext', '1', '[23]');
    assert.equal(editor.document.getText(), '1\n2\n2\n2\n3\n4\n6\n2\n4');
  });

  test('Context string can include spaces', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', ' 1 : 1 ', '2');
    assert.equal(editor.document.getText(), '1\n2\n2\n2\n3\n6\n2\n4');
  });

  test('Invalid context strings are reported', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);

    const stub = sinon.stub(vscode.window, 'showErrorMessage');

    try {
      const invalidContextStrings = ['', 'a', '-1', '1:'];
      for (const contextString of invalidContextStrings) {
        await withInputBox(sinon.match.any, contextString, async () => {
          await vscode.commands.executeCommand('filterlines.excludeLinesWithStringAndContext');
        });

        sinon.assert.calledOnce(stub);
        assert.equal(stub.firstCall.args[0], 'Expected a single number or before_context:after_context');
        stub.reset();
      }
    }
    finally {
      stub.restore();
    }
  });

  test('Exclude commands apply context to leftover lines rather than matching lines', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.excludeLinesWithRegexAndContext', '1', '[23]');
    assert.equal(editor.document.getText(), '0\n1\n2\n3\n4\n5\n6\n2\n4');
  });

  test('Context can be passed to promptFilterLines in arguments', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await withInputBox(sinon.match.any, '2', async () => {
      await vscode.commands.executeCommand('filterlines.promptFilterLines', { context: 1 });
      await untilStable();
    });
    assert.equal(editor.document.getText(), '1\n2\n2\n2\n3\n6\n2\n4');

    await setEditorText(editor, MORE_NUMBERS);
    await withInputBox(sinon.match.any, '2', async () => {
      await vscode.commands.executeCommand('filterlines.promptFilterLines', { before_context: 1, after_context: 0 });
      await untilStable();
    });
    assert.equal(editor.document.getText(), '1\n2\n2\n2\n6\n2\n');
  });
});
