/**
 * Convert a multi-line string from the readable form to a form suitable for comparison
 *
 * @example
 * ```typescript
 * const result = trimmed(` // leading newlines are stripped
 *   1: 2                   // the indentation detected on the first non-empty line is stripped from all lines
 *   2: 2
 * `);                      // trailing newlines are trimmed
 * // result == '1: 2\n2: 2`
 * ```
 *
 * @example Special handling of '|' delimiter makes it easier to define multi-line strings with each line starting with some indentation
 * ```typescript
 * const result = trimmed(`
 *   |  1: 1
 *   |  2: 2
 * `);
 * // result == '  1: 2\n  2: 2`
 * ```
 */
export function trimmed(str: string): string {
  let s = new S1();
  for (const line of str.split('\n'))
    s = s.feed(line);
  return s.result;
}

interface S {
  feed(line: string): S;
  readonly result: string;
}

class S1 implements S {

  feed(line: string): S {
    if (!line.trim())
      return this;

    const match = /\S/.exec(line);
    if (!match)
      throw new Error(`Could not find a non-space symbol in a non-space string '${line}'`);

    let s: S;
    if (line[match.index] === '|') {
      const indentation = line.substring(0, match.index + 1);
      s = new S2d(indentation);
    }
    else {
      const indentation = line.substring(0, match.index);
      s = new S2(indentation);
    }
    return s.feed(line);
  }
  get result() { return ''; }
}

class S2 implements S {
  private emptyAcc: string[] = [];
  private acc: string[] = [];

  constructor(private indentation: string) { }

  feed(line: string): S {
    if (!line.trim())
      this.emptyAcc.push(this.stripIndentation(line));
    else {
      this.acc.push(...this.emptyAcc);
      this.acc.push(this.stripIndentation(line));
      this.emptyAcc.length = 0;
    }
    return this;
  }

  private stripIndentation(line: string): string {
    if (line.startsWith(this.indentation))
      return line.substring(this.indentation.length);
    else if (this.indentation.startsWith(line))
      return '';
    else
      throw new Error(`Expected a line '${line}' to start with indentation '${this.indentation}'`);
  }

  get result() { return this.acc.join('\n'); }
}

class S2d implements S {
  private acc: string[] = [];

  constructor(private indentation: string) { }

  feed(line: string): S {
    if (line.startsWith(this.indentation)) {
      this.acc.push(line.substring(this.indentation.length));
      return this;
    }
    else {
      if (!!line.trim())
        throw new Error(`Expected a line '${line}' to either start with indentation '${this.indentation}' or be empty`);
      const s = new S3d(this.result);
      s.feed(line);
      return s;
    }
  }

  get result() { return this.acc.join('\n'); }
}

class S3d implements S {

  constructor(readonly result: string) { }

  feed(line: string): S {
    if (!!line.trim())
      throw new Error(`Unexpected non-empty line '${line}'`);
    return this;
  }
}
