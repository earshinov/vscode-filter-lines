import assert from 'assert';
import sinon from 'sinon';
import vscode from 'vscode';

import { MORE_NUMBERS } from './test-data';
import { REGISTRY } from './test-di';
import { setEditorText, invokeFilterLinesWithContext, withInputBox, untilStable, trimmed } from './test-utils';


suite('Context', () => {

  test('Context can be specified as a single number', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '1');
    assert.equal(editor.document.getText(), '1\n2\n2\n2\n3\n6\n2\n4');
  });

  test('Leading and trailing context can be specified separately', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '1:0');
    assert.equal(editor.document.getText(), '1\n2\n2\n2\n6\n2\n');

    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '0:1');
    assert.equal(editor.document.getText(), '2\n2\n2\n3\n2\n4');
  });

  test('Overlapping context lines are handled properly and not duplicated', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '4', '2');
    assert.equal(editor.document.getText(), '2\n3\n4\n5\n6\n2\n4');

    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithRegexAndContext', '[23]', '1');
    assert.equal(editor.document.getText(), '1\n2\n2\n2\n3\n4\n6\n2\n4');
  });

  test('Zero context and empty context string are allowed', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '');
    assert.equal(editor.document.getText(), '2\n2\n2\n2\n');

    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '0');
    assert.equal(editor.document.getText(), '2\n2\n2\n2\n');

    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '0:0');
    assert.equal(editor.document.getText(), '2\n2\n2\n2\n');
  });

  test('Context string can include spaces', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', ' 1 : 1 ');
    assert.equal(editor.document.getText(), '1\n2\n2\n2\n3\n6\n2\n4');
  });

  test('Invalid context strings are reported', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);

    const stub = sinon.stub(vscode.window, 'showErrorMessage');

    try {
      const invalidContextStrings = ['a', '-1', '1:'];
      for (const contextString of invalidContextStrings) {
        await invokeFilterLinesWithContext('filterlines.excludeLinesWithStringAndContext', '', contextString);

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
    await invokeFilterLinesWithContext('filterlines.excludeLinesWithRegexAndContext', '[23]', '1');
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

  // #region New tab

  test('New tab with context', async () => {
    REGISTRY.updateSettings({ createNewTab: true });

    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '1');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText(), '1\n2\n2\n2\n3\n6\n2\n4\n');
  });

  test('New tab with inverted search and context', async () => {
    REGISTRY.updateSettings({ createNewTab: true });

    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.excludeLinesWithStringAndContext', '2', '1');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText(), '0\n1\n2\n2\n3\n4\n5\n6\n2\n4\n');
  });

  test('New tab with line numbers and context', async () => {
    REGISTRY.updateSettings({ createNewTab: true, lineNumbers: true });

    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.includeLinesWithStringAndContext', '2', '1');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      |    2: 1
      |    3: 2
      |    4: 2
      |    5: 2
      |    6: 3
      |    9: 6
      |   10: 2
      |   11: 4
    `));
  });

  test('New tab with inverted search and line numbers and context', async () => {
    REGISTRY.updateSettings({ createNewTab: true, lineNumbers: true });

    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);
    await invokeFilterLinesWithContext('filterlines.excludeLinesWithStringAndContext', '2', '1');

    assert.equal(vscode.workspace.textDocuments.length, 2);
    editor = vscode.window.activeTextEditor!;
    assert.equal(editor.document.getText().trimRight(), trimmed(`
      |    1: 0
      |    2: 1
      |    3: 2
      |    5: 2
      |    6: 3
      |    7: 4
      |    8: 5
      |    9: 6
      |   10: 2
      |   11: 4
    `));
  });

  // #endregion
});
