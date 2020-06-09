import * as sinon from 'sinon';
import * as vscode from 'vscode';

import { LIPSUM } from './test-data';
import { setEditorText, updateConfiguration, invokeExtension, reopenEditor } from './test-utils';


suite('Preserve search', () => {

  test('Search is preserved', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, LIPSUM);

    updateConfiguration({ preserveSearch: true });

    await invokeExtension('filterlines.includeLinesWithRegex', 'ipsum');

    editor = await reopenEditor();

    await invokeExtension('filterlines.includeLinesWithRegex', sinon.match({ value: 'ipsum' }), undefined);
  });

  test('Preserved search is the same for string and regex search', async () => {
    let editor = vscode.window.activeTextEditor!;
    setEditorText(editor, LIPSUM);

    updateConfiguration({ preserveSearch: true });

    await invokeExtension('filterlines.includeLinesWithRegex', 'ipsum');

    editor = await reopenEditor();

    await invokeExtension('filterlines.excludeLinesWithString', sinon.match({ value: 'ipsum' }), undefined);
  });

  // VSCode API doesn't allow to get a reference to the new window
  test.skip('Search is not preserved after window is closed', async () => {
    const editor = vscode.window.activeTextEditor!;
    setEditorText(editor, LIPSUM);

    updateConfiguration({ preserveSearch: true });

    await invokeExtension('filterlines.includeLinesWithRegex', 'ipsum');

    await vscode.commands.executeCommand('vscode.openFolder');

    await invokeExtension('filterlines.includeLinesWithRegex', sinon.match({ value: sinon.match(value => value !== 'ipsum') }), undefined);
  });
});
