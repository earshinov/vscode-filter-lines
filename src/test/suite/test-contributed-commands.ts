import assert from 'assert';
import sinon from 'sinon';
import vscode from 'vscode';

import { NUMBERS, MORE_NUMBERS } from './test-data';
import { setEditorText, invokeFilterLines, invokeFilterLinesWithContext } from './test-utils';


suite('Contributed commands', () => {

  test('"Include Lines with Regex"', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    await invokeFilterLines(
      'filterlines.includeLinesWithRegex',
      sinon.match({
        prompt: 'Filter to lines matching: ',
        value: sinon.match.any,
      }),
      '[23]');

    assert.equal(editor.document.getText(), '2\n3\n2\n');
  });

  test('"Include Lines with String"', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    await invokeFilterLines(
      'filterlines.includeLinesWithString',
      sinon.match({
        prompt: 'Filter to lines containing: ',
        value: sinon.match.any,
      }),
      '2');

    assert.equal(editor.document.getText(), '2\n2\n');
  });

  test('"Exclude Lines with Regex"', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    await invokeFilterLines(
      'filterlines.excludeLinesWithRegex',
      sinon.match({
        prompt: 'Filter to lines not matching: ',
        value: sinon.match.any,
      }),
      '[14]');

    assert.equal(editor.document.getText(), '2\n3\n2\n');
  });

  test('"Exclude Lines with String"', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, NUMBERS);

    await invokeFilterLines(
      'filterlines.excludeLinesWithString',
      sinon.match({
        prompt: 'Filter to lines not containing: ',
        value: sinon.match.any,
      }),
      '2');

    assert.equal(editor.document.getText(), '1\n3\n4');
  });

  test('"Include Lines with Regex and Context"', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);

    await invokeFilterLinesWithContext(
      'filterlines.includeLinesWithRegexAndContext',
      sinon.match({
        prompt: 'Filter to lines matching: ',
        value: sinon.match.any,
      }),
      sinon.match({
        prompt: sinon.match((value: string) => value.startsWith('Context')),
        value: sinon.match.any,
      }),
      '[23]',
      '1',
    );

    assert.equal(editor.document.getText(), '1\n2\n2\n2\n3\n4\n6\n2\n4');
  });

  test('"Include Lines with String and Context"', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);

    await invokeFilterLinesWithContext(
      'filterlines.includeLinesWithStringAndContext',
      sinon.match({
        prompt: 'Filter to lines containing: ',
        value: sinon.match.any,
      }),
      sinon.match({
        prompt: sinon.match((value: string) => value.startsWith('Context')),
        value: sinon.match.any,
      }),
      '2',
      '1',
    );

    assert.equal(editor.document.getText(), '1\n2\n2\n2\n3\n6\n2\n4');
  });

  test('"Exclude Lines with Regex and Context"', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);

    await invokeFilterLinesWithContext(
      'filterlines.excludeLinesWithRegexAndContext',
      sinon.match({
        prompt: 'Filter to lines not matching: ',
        value: sinon.match.any,
      }),
      sinon.match({
        prompt: sinon.match((value: string) => value.startsWith('Context')),
        value: sinon.match.any,
      }),
      '[23]',
      '1',
    );

    assert.equal(editor.document.getText(), '0\n1\n2\n3\n4\n5\n6\n2\n4');
  });

  test('"Exclude Lines with String and Context"', async () => {
    const editor = vscode.window.activeTextEditor!;
    await setEditorText(editor, MORE_NUMBERS);

    await invokeFilterLinesWithContext(
      'filterlines.excludeLinesWithStringAndContext',
      sinon.match({
        prompt: 'Filter to lines not containing: ',
        value: sinon.match.any,
      }),
      sinon.match({
        prompt: sinon.match((value: string) => value.startsWith('Context')),
        value: sinon.match.any,
      }),
      '2',
      '1',
    );

    assert.equal(editor.document.getText(), '0\n1\n2\n2\n3\n4\n5\n6\n2\n4');
  });
});
