import vscode from 'vscode';


// #region Fixtures

/** 11 lines with repeats — exercises matching, context and folding. */
export const NUMBERS = ['0', '1', '2', '2', '2', '3', '4', '5', '6', '2', '4'].join('\n');

/** Mixed case — exercises case sensitivity and regex. */
export const MIXED = ['Alpha', 'beta', 'Gamma', 'ALPHA', 'gamma', 'delta'].join('\n');

export function linesOf(text: string): string[] {
  return text.split('\n');
}

// #endregion


// #region Independent oracle
//
// A deliberately naive, separate reimplementation of the filtering pipeline used
// to compute the expected result for every parameter combination. Keeping it
// independent from src/filter.ts is what makes the combination tests meaningful.

export interface Query {
  searchType: 'string' | 'regex';
  needle: string;
  caseSensitive: boolean;
  invertSearch: boolean;
  context: number;
}

function isMatch(line: string, q: Pick<Query, 'searchType' | 'needle' | 'caseSensitive'>): boolean {
  if (q.searchType === 'string')
    return q.caseSensitive
      ? line.includes(q.needle)
      : line.toLowerCase().includes(q.needle.toLowerCase());
  return new RegExp(q.needle, q.caseSensitive ? '' : 'i').test(line);
}

/** Sorted, de-duplicated line numbers kept after matching + inversion + context. */
export function expectedKept(lines: string[], q: Query): number[] {
  const matching: number[] = [];
  lines.forEach((line, i) => {
    if (isMatch(line, q) !== q.invertSearch)
      matching.push(i);
  });
  const keep = new Set<number>();
  for (const i of matching)
    for (let j = Math.max(0, i - q.context); j <= Math.min(lines.length - 1, i + q.context); ++j)
      keep.add(j);
  return [...keep].sort((a, b) => a - b);
}

function lineNumberPrefix(lineno: number): string {
  return `${String(lineno + 1).padStart(5)}: `;
}

/** Flat grep-like output for New tab / In-place modes. */
export function expectedFlat(lines: string[], kept: number[], lineNumbers: boolean): string {
  return kept.map((i) => (lineNumbers ? lineNumberPrefix(i) : '') + lines[i] + '\n').join('');
}

/**
 * Lines hidden by Fold mode, mirroring the anchored-fold rules in
 * `computeFoldRanges`: each run of non-kept lines is folded under the preceding
 * kept line; a run at the top of the file keeps its first line visible as the
 * header; runs shorter than the two-line minimum stay visible.
 */
export function expectedFoldHidden(lineCount: number, kept: number[]): Set<number> {
  const keep = new Set(kept);
  const hidden = new Set<number>();
  let start: number | null = null;
  for (let i = 0; i <= lineCount; ++i) {
    const gap = i < lineCount && !keep.has(i);
    if (gap) {
      if (start == null)
        start = i;
    }
    else if (start != null) {
      const header = start > 0 ? start - 1 : start;
      if (i - header >= 2)
        for (let j = header + 1; j < i; ++j)
          hidden.add(j);
      start = null;
    }
  }
  return hidden;
}

// #endregion


// #region Editor helpers

/** Open the given text as a fresh untitled document with LF line endings and focus it. */
export async function openDoc(content: string): Promise<vscode.TextEditor> {
  const doc = await vscode.workspace.openTextDocument({ content });
  const editor = await vscode.window.showTextDocument(doc);
  await editor.edit((edit) => edit.setEndOfLine(vscode.EndOfLine.LF));
  return editor;
}

export async function closeAllEditors(): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.closeAllEditors');
}

export function editorsCount(): number {
  return vscode.window.tabGroups.all.reduce((sum, group) => sum + group.tabs.length, 0);
}

/** Line numbers currently visible (i.e. not hidden by folding) in the editor. */
export function visibleLines(editor: vscode.TextEditor): Set<number> {
  const visible = new Set<number>();
  for (const range of editor.visibleRanges)
    for (let i = range.start.line; i <= range.end.line; ++i)
      visible.add(i);
  return visible;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Poll until `predicate` is true or the timeout elapses. */
export async function waitFor(predicate: () => boolean, timeoutMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline)
      throw new Error('waitFor: condition not met within timeout');
    await delay(10);
  }
}

// #endregion
