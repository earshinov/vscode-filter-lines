import assert from 'assert';
import vscode from 'vscode';

import { LIPSUM } from './test-data';
import { setEditorText, updateConfiguration, invokeExtension, reopenEditor } from './test-utils';


suite('Case sensitivity', () => {

  test('String search', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, LIPSUM);

    updateConfiguration({
      caseSensitiveStringSearch: false,
      caseSensitiveRegexSearch: true,
    });  // defaults

    await invokeExtension('filterlines.includeLinesWithString', 'Ipsum');
    assert.notEqual(editor.document.getText().trim(), '');

    editor = await reopenEditor();
    await setEditorText(editor, LIPSUM);

    updateConfiguration({
      caseSensitiveStringSearch: true,
      caseSensitiveRegexSearch: true,
    });

    await invokeExtension('filterlines.includeLinesWithString', 'Ipsum');
    assert.equal(editor.document.getText().trim(), '');
  });

  test('Regex search', async () => {
    let editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, LIPSUM);

    updateConfiguration({
      caseSensitiveStringSearch: false,
      caseSensitiveRegexSearch: true,
    });  // defaults

    await invokeExtension('filterlines.includeLinesWithRegex', 'Ipsum');
    assert.equal(editor.document.getText().trim(), '');

    editor = await reopenEditor();
    await setEditorText(editor, LIPSUM);

    updateConfiguration({
      caseSensitiveStringSearch: false,
      caseSensitiveRegexSearch: false,
    });

    await invokeExtension('filterlines.includeLinesWithRegex', 'Ipsum');
    assert.notEqual(editor.document.getText().trim(), '');
  });
});
