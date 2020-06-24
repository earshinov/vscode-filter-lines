import sinon from 'sinon';
import vscode from 'vscode';

import { LIPSUM } from './test-data';
import { REGISTRY } from './test-di';
import { setEditorText, invokeFilterLines, reopenEditor } from './test-utils';


suite('Saved search', () => {

  test('Preserved search works', async () => {
    REGISTRY.updateSettings({ preserveSearch: true });

    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, LIPSUM);
    await invokeFilterLines('filterlines.includeLinesWithRegex', 'ipsum');

    editor = await reopenEditor();

    await invokeFilterLines('filterlines.includeLinesWithRegex', sinon.match({ value: 'ipsum' }), undefined);
  });

  test('Preserved search can be turned off', async () => {
    REGISTRY.updateSettings({ preserveSearch: false });

    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, LIPSUM);
    await invokeFilterLines('filterlines.includeLinesWithRegex', 'ipsum');

    editor = await reopenEditor();

    await invokeFilterLines('filterlines.includeLinesWithRegex', sinon.match({ value: '' }), undefined);
  });

  test('Preserved search is the same for string and regex search', async () => {
    REGISTRY.updateSettings({ preserveSearch: true });

    let editor = vscode.window.activeTextEditor!;
    setEditorText(editor, LIPSUM);
    await invokeFilterLines('filterlines.includeLinesWithRegex', 'ipsum');

    editor = await reopenEditor();

    await invokeFilterLines('filterlines.excludeLinesWithString', sinon.match({ value: 'ipsum' }), undefined);
  });

  // VSCode API doesn't allow to get a reference to the new window
  test.skip('Preserved search disappears after window is closed', async () => {
    REGISTRY.updateSettings({ preserveSearch: true });

    const editor = vscode.window.activeTextEditor!;
    setEditorText(editor, LIPSUM);
    await invokeFilterLines('filterlines.includeLinesWithRegex', 'ipsum');

    await vscode.commands.executeCommand('vscode.openFolder');

    await invokeFilterLines('filterlines.includeLinesWithRegex', sinon.match({ value: sinon.match(value => value !== 'ipsum') }), undefined);
  });
});
