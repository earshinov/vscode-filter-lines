import assert from 'assert';
import sinon from 'sinon';
import vscode from 'vscode';

import { WELCOME_SHOWN_KEY, showWelcome } from '../../welcome';


function fakeContext(shown = false) {
  const store = new Map<string, any>();
  if (shown)
    store.set(WELCOME_SHOWN_KEY, true);

  return {
    store,
    extensionUri: vscode.Uri.file('/extension'),
    globalState: {
      get: (key: string, def?: any) => (store.has(key) ? store.get(key) : def),
      update: (key: string, value: any) => { store.set(key, value); return Promise.resolve(); },
    },
  };
}


suite('Welcome page', () => {

  test('first activation opens WELCOME.md and stores the flag', async () => {
    const context = fakeContext();
    const execute = sinon.stub(vscode.commands, 'executeCommand').resolves(undefined);
    try {
      await showWelcome(context as any);

      sinon.assert.calledOnce(execute);
      assert.strictEqual(execute.firstCall.args[0], 'markdown.showPreview');
      const actualUri = execute.firstCall.args[1] as vscode.Uri;
      const expectedUri = vscode.Uri.joinPath(context.extensionUri, 'WELCOME.md');
      assert.strictEqual(actualUri.toString(), expectedUri.toString());
      assert.strictEqual(context.store.get(WELCOME_SHOWN_KEY), true);
    }
    finally {
      execute.restore();
    }
  });

  test('later activations do not reopen the page', async () => {
    const context = fakeContext(true);
    const execute = sinon.stub(vscode.commands, 'executeCommand').resolves(undefined);
    try {
      await showWelcome(context as any);
      sinon.assert.notCalled(execute);
    }
    finally {
      execute.restore();
    }
  });
});
