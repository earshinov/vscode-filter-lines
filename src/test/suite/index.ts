import path from 'path';

import glob from 'glob';
import Mocha from 'mocha';

import { withCoverage } from './test-infra/coverage';


export async function run(): Promise<void> {
  const projectRoot = path.resolve(__dirname, '../../..');
  const testsRoot = path.resolve(__dirname, '..');

  await withCoverage(projectRoot, async () => {

    // Create the mocha test
    const mocha = new Mocha({
      ui: 'tdd',
      // For debugging
      //timeout: '1h',
    });
    mocha.useColors(true);

    const files: string[] = await new Promise((resolve, reject) => {
      glob('**/test-*.js', { cwd: testsRoot, }, (err, files) => { err ? reject(err) : resolve(files); });
    });

    // Add files to the test suite
    files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

    const failures: number = await new Promise(resolve => mocha.run(resolve));
    if (failures > 0)
      throw new Error(`${failures} tests failed.`);
  });
}
