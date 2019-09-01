/**
 * Wraps the given function so that each invocation is executed inside a try-catch block.
 *
 * Caught exceptions are logged and re-thrown.
 */
export function catchErrors<T extends (...args: any[]) => void>(fn: T): T {
  return ((...args: any[]) => {
    try {
      return fn(...args);
    }
    catch (e) {
      console.error(e);
      throw e;
    }
  }) as any;
}


/**
 * Escapes string for use in Javascript regex
 *
 * https://stackoverflow.com/a/3561711/675333
 */
export function escapeRegexp(s: string): string {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
