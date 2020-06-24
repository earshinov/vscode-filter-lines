import sinon from 'sinon';
import vscode from 'vscode';

import { LIPSUM } from './test-data';
import { REGISTRY } from './test-di';
import { setEditorText, invokeFilterLines, reopenEditor, invokeFilterLinesWithContext } from './test-utils';


suite('Saved context', () => {

  test('Context is preserved', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, LIPSUM);

    await invokeFilterLinesWithContext('filterlines.includeLinesWithRegexAndContext', 'ipsum', '1');

    editor = await reopenEditor();

    await invokeFilterLinesWithContext('filterlines.includeLinesWithRegexAndContext', sinon.match.any, sinon.match({ value: '1', }), 'ipsum', undefined);
  });

  test('Context is preserved irrespective of the preserveSearch setting', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, LIPSUM);

    REGISTRY.updateConfiguration({ preserveSearch: false });

    await invokeFilterLinesWithContext('filterlines.includeLinesWithRegexAndContext', 'ipsum', '1');

    editor = await reopenEditor();

    await invokeFilterLinesWithContext('filterlines.includeLinesWithRegexAndContext', sinon.match.any, sinon.match({ value: '1' }), 'ipsum', undefined);
  });

  test('Preserved context is the same for string and regex search', async () => {
    let editor = vscode.window.activeTextEditor!;
    setEditorText(editor, LIPSUM);

    await invokeFilterLinesWithContext('filterlines.includeLinesWithRegexAndContext', 'ipsum', '1');

    editor = await reopenEditor();

    await invokeFilterLinesWithContext('filterlines.excludeLinesWithStringAndContext', sinon.match.any, sinon.match({ value: '1' }), 'ipsum', undefined);
  });

  // VSCode API doesn't allow to get a reference to the new window
  test.skip('Preserved context is persisted after window is closed', async () => {
    const editor = vscode.window.activeTextEditor!;
    setEditorText(editor, LIPSUM);

    await invokeFilterLinesWithContext('filterlines.includeLinesWithRegexAndContext', 'ipsum', '1');

    await vscode.commands.executeCommand('vscode.openFolder');

    await invokeFilterLinesWithContext('filterlines.includeLinesWithRegexAndContext', sinon.match.any, sinon.match({ value: '1' }), 'ipsum', undefined);
  });
});
