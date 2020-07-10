import assert from 'assert';
import vscode from 'vscode';

import { LIPSUM } from './test-data';
import { REGISTRY } from './test-di';
import { setEditorText, invokeFilterLines, reopenEditor } from './test-utils';


suite('Case sensitivity', () => {

  test('String search', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, LIPSUM);

    REGISTRY.updateSettings({
      caseSensitiveStringSearch: false,
      caseSensitiveRegexSearch: true,
    });  // defaults

    await invokeFilterLines('filterlines.includeLinesWithString', 'Ipsum');
    assert.notEqual(editor.document.getText().trim(), '');

    editor = await reopenEditor();
    await setEditorText(editor, LIPSUM);

    REGISTRY.updateSettings({
      caseSensitiveStringSearch: true,
      caseSensitiveRegexSearch: true,
    });

    await invokeFilterLines('filterlines.includeLinesWithString', 'Ipsum');
    assert.equal(editor.document.getText().trim(), '');
  });

  test('Regex search', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, LIPSUM);

    REGISTRY.updateSettings({
      caseSensitiveStringSearch: false,
      caseSensitiveRegexSearch: true,
    });  // defaults

    await invokeFilterLines('filterlines.includeLinesWithRegex', 'Ipsum');
    assert.equal(editor.document.getText().trim(), '');

    editor = await reopenEditor();
    await setEditorText(editor, LIPSUM);

    REGISTRY.updateSettings({
      caseSensitiveStringSearch: false,
      caseSensitiveRegexSearch: false,
    });

    await invokeFilterLines('filterlines.includeLinesWithRegex', 'Ipsum');
    assert.notEqual(editor.document.getText().trim(), '');
  });
});
