import sinon from 'sinon';

import { withInputBox } from './test-utils';


function press(shortcut: string) {
  // Press the shortcut manually
}


// VS Code doesn't seem to provide a way to trigger shortcuts programmatically.
suite.skip('Shortcuts', () => {

  test('"Include Lines with Regex"', async () => {
    await withInputBox(sinon.match({
      prompt: 'Filter to lines matching: ',
      value: sinon.match.any,
    }), undefined, async () => {
      press('Ctrl-K Ctrl-R');
    });
  });

  test('"Include Lines with String"', async () => {
    await withInputBox(sinon.match({
      prompt: 'Filter to lines containing: ',
      value: sinon.match.any,
    }), undefined, async () => {
      press('Ctrl-K Ctrl-S');
    });
  });
});
