import sinon from 'sinon';
import vscode from 'vscode';

import { LIPSUM } from './test-data';
import { REGISTRY } from './test-di';
import { setEditorText, findPosition, invokeFilterLines, reopenEditor } from './test-utils';


suite('Word under cursor', () => {

  test('Without preserveSearch', async () => {
    helper(false);
  });

  test('With preserveSearch', async () => {
    helper(true);
  });

  async function helper(preserveSearch: boolean) {
    REGISTRY.updateSettings({ preserveSearch });

    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, LIPSUM);

    let pos = findPosition(editor.document, 'fe|ugiat');
    editor.selection = new vscode.Selection(pos, pos);

    await invokeFilterLines(
      'filterlines.includeLinesWithRegex',
      sinon.match({
        prompt: sinon.match.any,
        value: 'feugiat',
      }),
      undefined);

    editor = await reopenEditor();
    await setEditorText(editor, LIPSUM);

    pos = findPosition(editor.document, 'consecte|tur');
    editor.selection = new vscode.Selection(pos, pos);

    await invokeFilterLines(
      'filterlines.includeLinesWithRegex',
      sinon.match({
        prompt: sinon.match.any,
        value: preserveSearch ? 'feugiat' : 'consectetur',
      }),
      undefined);
  }
});
