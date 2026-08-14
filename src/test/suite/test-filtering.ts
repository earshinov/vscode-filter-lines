import assert from 'assert';
import vscode from 'vscode';

import {
  MIXED,
  NUMBERS,
  Query,
  editorsCount,
  expectedFlat,
  expectedKept,
  linesOf,
  openDoc,
} from './support';


interface NamedQuery extends Query {
  label: string;
  fixture: string;
}

// Each named query fixes the search type + needle; the matrix below varies every
// other parameter. Between the two queries all search-type / case / invert paths
// are exercised.
const QUERIES: Array<Pick<NamedQuery, 'label' | 'fixture' | 'searchType' | 'needle'>> = [
  { label: 'string "2" in NUMBERS', fixture: NUMBERS, searchType: 'string', needle: '2' },
  { label: 'regex "a" in MIXED', fixture: MIXED, searchType: 'regex', needle: 'a' },
];

const BOOLS = [false, true];
const CONTEXTS = [0, 1];
const OUTPUTS: Array<'newtab' | 'inplace'> = ['newtab', 'inplace'];


suite('Filtering (all combinations)', () => {

  for (const q of QUERIES)
    for (const invertSearch of BOOLS)
      for (const caseSensitive of BOOLS)
        for (const context of CONTEXTS)
          for (const outputMode of OUTPUTS)
            for (const lineNumbers of BOOLS) {

              const name =
                `${q.label} | ${invertSearch ? 'exclude' : 'include'} | ` +
                `${caseSensitive ? 'case' : 'nocase'} | ctx=${context} | ${outputMode} | ` +
                `${lineNumbers ? 'nums' : 'nonums'}`;

              test(name, async () => {
                const lines = linesOf(q.fixture);
                const editor = await openDoc(q.fixture);

                await vscode.commands.executeCommand('filterlines.filterLines', {
                  search_type: q.searchType,
                  needle: q.needle,
                  invert_search: invertSearch,
                  case_sensitive: caseSensitive,
                  context: context,
                  output_mode: outputMode,
                  line_numbers: lineNumbers,
                });

                const kept = expectedKept(lines, { ...q, invertSearch, caseSensitive, context });
                const expected = expectedFlat(lines, kept, lineNumbers);

                const active = vscode.window.activeTextEditor!;
                assert.strictEqual(active.document.getText(), expected);
                assert.strictEqual(editorsCount(), outputMode === 'newtab' ? 2 : 1);

                if (outputMode === 'newtab')
                  // The original document must be left untouched.
                  assert.strictEqual(editor.document.getText(), q.fixture);
              });
            }

  test('v1 default: regex search is case-sensitive', async () => {
    await openDoc(MIXED);
    await vscode.commands.executeCommand('filterlines.filterLines', {
      search_type: 'regex',
      needle: 'Alpha',
      output_mode: 'newtab',
    });
    assert.strictEqual(vscode.window.activeTextEditor!.document.getText(), 'Alpha\n');
  });

  test('v1 default: string search is case-insensitive', async () => {
    await openDoc(MIXED);
    await vscode.commands.executeCommand('filterlines.filterLines', {
      search_type: 'string',
      needle: 'alpha',
      output_mode: 'newtab',
    });
    assert.strictEqual(vscode.window.activeTextEditor!.document.getText(), 'Alpha\nALPHA\n');
  });
});
