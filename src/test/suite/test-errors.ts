import assert from 'assert';
import sinon from 'sinon';
import vscode from 'vscode';

import { NUMBERS, closeAllEditors, editorsCount, openDoc } from './support';


suite('Errors and edge cases', () => {

  test('invalid regex reports an error and leaves the document unchanged', async () => {
    const editor = await openDoc(NUMBERS);
    const stub = sinon.stub(vscode.window, 'showErrorMessage');
    try {
      await vscode.commands.executeCommand('filterlines.filterLines', {
        search_type: 'regex',
        needle: '(',
        output_mode: 'inplace',
      });
      sinon.assert.calledOnce(stub);
      assert.ok(/invalid regular expression/i.test(String(stub.firstCall.args[0])));
    }
    finally {
      stub.restore();
    }
    assert.strictEqual(editor.document.getText(), NUMBERS);
  });

  test('no open editor shows an informational message and creates nothing', async () => {
    await closeAllEditors();
    const stub = sinon.stub(vscode.window, 'showInformationMessage');
    try {
      await vscode.commands.executeCommand('filterlines.filterLines', {
        search_type: 'string',
        needle: '2',
        output_mode: 'newtab',
      });
      sinon.assert.calledOnce(stub);
      assert.ok(/open a file/i.test(String(stub.firstCall.args[0])));
    }
    finally {
      stub.restore();
    }
    assert.strictEqual(editorsCount(), 0);
  });

  test('empty needle matches every line', async () => {
    await openDoc(NUMBERS);
    await vscode.commands.executeCommand('filterlines.filterLines', {
      search_type: 'regex',
      needle: '',
      output_mode: 'newtab',
    });
    const active = vscode.window.activeTextEditor!;
    assert.strictEqual(active.document.getText(), NUMBERS + '\n');
  });
});
