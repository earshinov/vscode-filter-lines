import sinon from 'sinon';
import vscode from 'vscode';

import { LIPSUM } from './test-data';
import { setEditorText, updateConfiguration, invokeFilterLines, reopenEditor, invokeFilterLinesWithContext } from './test-utils';


suite('Preserve search', () => {

  test('Preserved search works', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, LIPSUM);

    updateConfiguration({ preserveSearch: true });

    await invokeFilterLines('filterlines.includeLinesWithRegex', 'ipsum');

    editor = await reopenEditor();

    await invokeFilterLines('filterlines.includeLinesWithRegex', sinon.match({ value: 'ipsum' }), undefined);
  });

  test('Preserved search can be turned off', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, LIPSUM);

    updateConfiguration({ preserveSearch: false });

    await invokeFilterLines('filterlines.includeLinesWithRegex', 'ipsum');

    editor = await reopenEditor();

    await invokeFilterLines('filterlines.includeLinesWithRegex', sinon.match({ value: '' }), undefined);
  });

  test('Preserved search is the same for string and regex search', async () => {
    let editor = vscode.window.activeTextEditor!;
    setEditorText(editor, LIPSUM);

    updateConfiguration({ preserveSearch: true });

    await invokeFilterLines('filterlines.includeLinesWithRegex', 'ipsum');

    editor = await reopenEditor();

    await invokeFilterLines('filterlines.excludeLinesWithString', sinon.match({ value: 'ipsum' }), undefined);
  });

  // VSCode API doesn't allow to get a reference to the new window
  test.skip('Preserved search disappears after window is closed', async () => {
    const editor = vscode.window.activeTextEditor!;
    setEditorText(editor, LIPSUM);

    updateConfiguration({ preserveSearch: true });

    await invokeFilterLines('filterlines.includeLinesWithRegex', 'ipsum');

    await vscode.commands.executeCommand('vscode.openFolder');

    await invokeFilterLines('filterlines.includeLinesWithRegex', sinon.match({ value: sinon.match(value => value !== 'ipsum') }), undefined);
  });

  test('Context is preserved as well', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, LIPSUM);

    updateConfiguration({ preserveSearch: true });

    await invokeFilterLinesWithContext('filterlines.includeLinesWithRegexAndContext', 'ipsum', '1');

    editor = await reopenEditor();

    await invokeFilterLinesWithContext('filterlines.includeLinesWithRegexAndContext', sinon.match.any, sinon.match({ value: '1', }), undefined, undefined);
  });

  test('Preserved context can be turned off', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, LIPSUM);

    updateConfiguration({ preserveSearch: false });

    await invokeFilterLinesWithContext('filterlines.includeLinesWithRegexAndContext', 'ipsum', '1');

    editor = await reopenEditor();

    await invokeFilterLinesWithContext('filterlines.includeLinesWithRegexAndContext', sinon.match.any, sinon.match({ value: '' }), undefined, undefined);
  });

  test('Preserved context is the same for string and regex search', async () => {
    let editor = vscode.window.activeTextEditor!;
    setEditorText(editor, LIPSUM);

    updateConfiguration({ preserveSearch: true });

    await invokeFilterLinesWithContext('filterlines.includeLinesWithRegexAndContext', 'ipsum', '1');

    editor = await reopenEditor();

    await invokeFilterLinesWithContext('filterlines.excludeLinesWithStringAndContext', sinon.match.any, sinon.match({ value: 'ipsum' }), undefined, undefined);
  });

  // VSCode API doesn't allow to get a reference to the new window
  test.skip('Preserved context disappears after window is closed', async () => {
    const editor = vscode.window.activeTextEditor!;
    setEditorText(editor, LIPSUM);

    updateConfiguration({ preserveSearch: true });

    await invokeFilterLinesWithContext('filterlines.includeLinesWithRegexAndContext', 'ipsum', '1');

    await vscode.commands.executeCommand('vscode.openFolder');

    await invokeFilterLinesWithContext('filterlines.includeLinesWithRegexAndContext', sinon.match.any, sinon.match({ value: sinon.match(value => value !== '1') }), undefined, undefined);
  });
});
