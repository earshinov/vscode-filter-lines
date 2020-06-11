/**
 * This module is your guide into collecting coverage when running VS Code extension tests. Apart from some TypeScript
 * functions, it provides the documentation you are reading right now that covers the whole process.
 *
 * ---------------------------------------------------------------------------------------------------------------------
 * BACKGROUND INFORMATION
 * ---------------------------------------------------------------------------------------------------------------------
 *
 * There is one crucial difference between VS Code extension tests and ordinary unit tests you are probably familiar with.
 * When running ordinary unit tests, the tests themselves and the code under test are loaded into a node.js process together.
 * Thanks to that, and also some clever code inside `nyc` you can run your tests and collect coverage with a simple command
 * `nyc mocha` given in the [official docs](https://istanbul.js.org/docs/tutorials/mocha/).  Behind the scenes it hooks into
 * node.js's `require` calls, instrumenting the code on the fly with babel and [babel-plugin-istanbul][].
 *
 * Running VS Code extension tests involves more steps:
 *
 *   1. The src/test/runTest script launches a new VS Code instance, supplying it with paths to the extension
 *      and the unit tests entry point (src/test/suite/index)
 *   2. VS Code instance loads extensions, including the extension under test
 *   3. VS code instance loads and executes the tests
 *
 * Consequently, in order to collect coverage one has to instrument extension code separately before running the tests.
 * Development workflow looks like the following:
 *
 *   1. Build the extension using babel and [babel-plugin-istanbul][]
 *   2. Run VS Code extension tests, manually invoking `nyc` for writing collected coverage to disk
 *
 * ---------------------------------------------------------------------------------------------------------------------
 * INVOKING NYC
 * ---------------------------------------------------------------------------------------------------------------------
 *
 * Manually invoking NYC presents certain difficulties:
 *
 *   a. It has undocumented API.  You shouldn't be too concerned about this issue --
 *      just use the provided `withCoverage` function and don't think twice about it.
 *
 *   b. It uses case-sensitive path matching under Windows.  This one can cause some or all of expected coverage data
 *      to go missing, and make you spend a few hours digging in the source code of `nyc` and [test-exclude][].
 *      Fortunately, there is a PR [#44 Make sure glob and minimatch are case insenitive on win32][PR44].
 *      The best course of action is:
 *
 *        - Install test-exclude from the PR branch: `yarn add --dev test-exclude@j03m/test-exclude#j03m/fix2`
 *        - Look through `yarn.lock`, making sure that this is the only version of `test-exclude` that is used
 *
 * ---------------------------------------------------------------------------------------------------------------------
 * REFERENCES
 * ---------------------------------------------------------------------------------------------------------------------
 *
 * Running VS Code extension tests with coverage is a fairly known topic.
 *
 * Useful links:
 *   - https://stackoverflow.com/questions/56301056/how-do-a-generate-vscode-typescript-extension-coverage-report,
 *     https://stackoverflow.com/a/59146892/675333,
 *     https://github.com/jedwards1211/vscode-extension-skeleton,
 *     https://github.com/earshinov/vscode-extension-template
 *
 * --
 * [babel-plugin-istanbul](https://www.npmjs.com/package/babel-plugin-istanbul)
 * [test-exclude](https://www.npmjs.com/package/test-exclude)
 * [PR44](https://github.com/istanbuljs/test-exclude/pull/44)
 */

// tslint:disable-next-line:no-reference
/// <reference path="./coverage.d.ts" />

import NYC from 'nyc';
import configUtil from 'nyc/lib/config-util';

/** Performs necessary magic for capturing coverage with nyc */
export async function withCoverage(projectRoot: string, cb: () => void | Thenable<void>): Promise<void> {
  const { yargs } = await configUtil(projectRoot);
  const args = yargs.parse();
  const nyc = new NYC(args);

  await nyc.createTempDirectory();
  try {
    await cb();
  }
  finally {
    await nyc.writeCoverageFile();
  }
}
