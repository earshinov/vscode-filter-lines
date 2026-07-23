import assert from 'assert';
import vscode from 'vscode';

import { DEFAULT_STATE, FilterLinesViewProvider } from '../../extension';
import { NUMBERS, expectedFlat, expectedKept, linesOf, openDoc, waitFor } from './support';


const STATE_KEY = 'filterLines.formState';

function fakeContext() {
  const store = new Map<string, any>();
  return {
    store,
    extensionUri: vscode.Uri.file('/ext'),
    subscriptions: [] as any[],
    globalState: {
      get: (key: string, def?: any) => (store.has(key) ? store.get(key) : def),
      update: (key: string, value: any) => { store.set(key, value); return Promise.resolve(); },
    },
  };
}

function fakeWebview() {
  let handler: ((message: any) => void) | undefined;
  const posted: any[] = [];
  const webview = {
    options: {} as any,
    html: '',
    cspSource: 'vscode-webview:',
    asWebviewUri: (uri: vscode.Uri) => uri,
    onDidReceiveMessage: (cb: (message: any) => void) => { handler = cb; return { dispose() { } }; },
    postMessage: (message: any) => { posted.push(message); return Promise.resolve(true); },
    posted,
    fire: (message: any) => handler!(message),
  };
  return webview;
}

function resolve() {
  const context = fakeContext();
  const provider = new FilterLinesViewProvider(context as any);
  const webview = fakeWebview();
  provider.resolveWebviewView({ webview } as any);
  return { context, webview };
}


suite('Webview provider', () => {

  test('resolve enables scripts and renders the form HTML', () => {
    const { webview } = resolve();
    assert.strictEqual(webview.options.enableScripts, true);
    assert.ok(/id="search-box"/.test(webview.html));
    assert.ok(/main\.js/.test(webview.html));
  });

  test('"ready" replies with the persisted state', () => {
    const { webview } = resolve();
    webview.fire({ type: 'ready' });
    const restore = webview.posted.find((m) => m.type === 'restore');
    assert.ok(restore, 'expected a restore message');
    assert.deepStrictEqual(restore.state, { ...DEFAULT_STATE });
  });

  test('"persist" writes the state to globalState', () => {
    const { context, webview } = resolve();
    const state = { ...DEFAULT_STATE, needle: 'abc', useRegex: false, action: 'exclude' };
    webview.fire({ type: 'persist', state });
    assert.deepStrictEqual(context.store.get(STATE_KEY), state);
  });

  test('"filter" transforms the active editor', async () => {
    const editor = await openDoc(NUMBERS);
    const { webview } = resolve();
    webview.fire({
      type: 'filter',
      state: { ...DEFAULT_STATE, needle: '2', useRegex: true, action: 'include', outputMode: 'inplace', context: 0 },
    });
    const lines = linesOf(NUMBERS);
    const expected = expectedFlat(lines, expectedKept(lines, {
      searchType: 'regex', needle: '2', caseSensitive: false, invertSearch: false, context: 0,
    }), false);
    await waitFor(() => editor.document.getText() === expected);
  });

  test('"filter" with an invalid regex posts an "invalid" message', async () => {
    await openDoc(NUMBERS);
    const { webview } = resolve();
    webview.fire({
      type: 'filter',
      state: { ...DEFAULT_STATE, needle: '(', useRegex: true, outputMode: 'inplace' },
    });
    await waitFor(() => webview.posted.some((m) => m.type === 'invalid'));
    const invalid = webview.posted.find((m) => m.type === 'invalid');
    assert.ok(/invalid regular expression/i.test(invalid.message));
  });
});
