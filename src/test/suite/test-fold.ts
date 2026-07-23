import assert from 'assert';
import vscode from 'vscode';

import {
  NUMBERS,
  Query,
  delay,
  editorsCount,
  expectedFoldHidden,
  expectedKept,
  linesOf,
  openDoc,
  visibleLines,
} from './support';


async function runFold(needle: string, extra: Partial<Query> = {}): Promise<vscode.TextEditor> {
  const editor = await openDoc(NUMBERS);
  await vscode.commands.executeCommand('filterlines.filterLines', {
    search_type: 'string',
    needle: needle,
    invert_search: extra.invertSearch ?? false,
    case_sensitive: extra.caseSensitive ?? false,
    context: extra.context ?? 0,
    output_mode: 'fold',
    line_numbers: false,
  });
  // Give the editor a tick to apply folding before reading visibleRanges.
  await delay(100);
  return editor;
}

function assertFold(editor: vscode.TextEditor, query: Query): void {
  const lines = linesOf(NUMBERS);

  // Fold never edits the document, and never opens a new tab.
  assert.strictEqual(editor.document.getText(), NUMBERS);
  assert.strictEqual(editorsCount(), 1);

  const kept = expectedKept(lines, query);
  const hidden = expectedFoldHidden(lines.length, kept);
  const expectedVisible = new Set<number>();
  for (let i = 0; i < lines.length; ++i)
    if (!hidden.has(i))
      expectedVisible.add(i);

  assert.deepStrictEqual([...visibleLines(editor)].sort((a, b) => a - b), [...expectedVisible].sort((a, b) => a - b));
}

const baseQuery = { searchType: 'string', caseSensitive: false, invertSearch: false, context: 0 } as const;


suite('Fold mode', () => {

  test('match in the middle folds the surrounding runs (top line stays as header)', async () => {
    const editor = await runFold('3');
    assertFold(editor, { ...baseQuery, needle: '3' });
  });

  test('match on the first line has no leading gap', async () => {
    const editor = await runFold('0');
    assertFold(editor, { ...baseQuery, needle: '0' });
  });

  test('no match folds the whole file under the first line', async () => {
    const editor = await runFold('zzz');
    assertFold(editor, { ...baseQuery, needle: 'zzz' });
  });

  test('every line matching leaves nothing folded', async () => {
    // Every line contains a digit.
    const editor = await runFold('', { });
    // Empty string matches every line (command path), so all lines are kept.
    const lines = linesOf(NUMBERS);
    const all = new Set<number>();
    for (let i = 0; i < lines.length; ++i) all.add(i);
    assert.strictEqual(editor.document.getText(), NUMBERS);
    assert.deepStrictEqual([...visibleLines(editor)].sort((a, b) => a - b), [...all]);
  });

  test('context reduces the folded runs', async () => {
    const editor = await runFold('3', { context: 1 });
    assertFold(editor, { ...baseQuery, needle: '3', context: 1 });
  });
});
