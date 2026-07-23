import { escapeRegexp } from './utils';


export type SearchType = 'string' | 'regex';
export type OutputMode = 'fold' | 'inplace' | 'newtab';

export interface FilterParams {
  searchType: SearchType;
  invertSearch: boolean;
  needle: string;
  caseSensitive: boolean;
  /** Number of context lines to keep around each match (symmetric, like Ctrl-Shift-F). */
  context: number;
  outputMode: OutputMode;
  lineNumbers: boolean;
}

/** Inclusive-exclusive line range: [start, end). */
export type LineRange = [number, number];


export function constructSearchRegExp(needle: string, searchType: SearchType, caseSensitive: boolean): RegExp {
  const source = searchType === 'string' ? escapeRegexp(needle) : needle;
  const flags = caseSensitive ? '' : 'i';
  return new RegExp(source, flags);
}


/**
 * Returns the sorted list of line numbers that match the search (after applying
 * `invertSearch`).  Context is NOT applied here.
 */
export function computeMatchingLines(lines: string[], re: RegExp, invertSearch: boolean): number[] {
  const result: number[] = [];
  for (let lineno = 0; lineno < lines.length; ++lineno)
    if (re.test(lines[lineno]) !== invertSearch)
      result.push(lineno);
  return result;
}


/**
 * Expands a sorted list of matching line numbers with `context` lines on each
 * side, returning the sorted, de-duplicated list of line numbers to keep.
 */
export function expandWithContext(matchingLines: number[], context: number, lineCount: number): number[] {
  const kept: number[] = [];
  let nextFree = 0; // first line number not yet added
  for (const lineno of matchingLines) {
    const start = Math.max(lineno - context, nextFree);
    const end = Math.min(lineno + context + 1, lineCount);
    for (let i = start; i < end; ++i)
      kept.push(i);
    nextFree = end;
  }
  return kept;
}


/**
 * Given a sorted list of line numbers to keep, returns the ranges to fold away
 * so that every non-kept line is hidden.
 *
 * Each run of consecutive non-kept lines is folded under the preceding kept
 * line: the returned range `[header, end)` uses `header = start - 1` (the last
 * kept line before the run) so the fold's visible header is a match/context
 * line rather than a non-matching one. A run at the very top of the file has no
 * preceding kept line, so it uses `header = start` (its first line stays
 * visible as the header — unavoidable with native folding).
 *
 * Only ranges spanning at least two lines are returned, since a fold needs a
 * header plus at least one hidden line. This always holds for anchored runs
 * (header + >= 1 non-kept line) and skips a single-line leading run.
 */
export function computeFoldRanges(keptLines: number[], lineCount: number): LineRange[] {
  const keep = new Set(keptLines);
  const ranges: LineRange[] = [];
  let start: number | null = null; // first non-kept line of the current run
  for (let lineno = 0; lineno <= lineCount; ++lineno) {
    const isGap = lineno < lineCount && !keep.has(lineno);
    if (isGap) {
      if (start == null)
        start = lineno;
    }
    else if (start != null) {
      const header = start > 0 ? start - 1 : start;
      if (lineno - header >= 2)
        ranges.push([header, lineno]);
      start = null;
    }
  }
  return ranges;
}


/** +1 to make line numbers 1-based, padded to 5 columns, matching legacy output. */
export function formatLineNumber(lineno: number): string {
  return `${String(lineno + 1).padStart(5)}: `;
}


/**
 * Builds the flat, grep-like output for the `inplace` and `newtab` modes from
 * the sorted list of kept line numbers.
 */
export function buildFilteredContent(lines: string[], keptLines: number[], lineNumbers: boolean): string {
  const acc: string[] = [];
  for (const lineno of keptLines) {
    if (lineNumbers)
      acc.push(formatLineNumber(lineno));
    acc.push(lines[lineno]);
    acc.push('\n');
  }
  return acc.join('');
}
