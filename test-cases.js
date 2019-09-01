// Test cases below are meant to be executed manually.

const NUMBERS = `
1
2
3
2
4`.trim();

beforeEach(function() {
  resetConfiguration();
});

suite('Available commands', function() {

  test('Include Lines With Regex', function() {
    setDocumentText(NUMBERS);
    runCommand('Filter Lines: Include Lines With Regex');
    assertInputPrompt('Filter to lines matching: ');
    setInputValue('[23]');
    press('Enter');
    assertDocumentTextTrimmed('2\n3\n2');
  });

  test('Include Lines With String', function() {
    setDocumentText(NUMBERS);
    runCommand('Filter Lines: Include Lines With String');
    assertInputPrompt('Filter to lines containing: ')
    setInputValue('2');
    press('Enter');
    assertDocumentTextTrimmed('2\n2');
  });

  test('Exclude Lines With Regex', function() {
    setDocumentText(NUMBERS);
    runCommand('Filter Lines: Exclude Lines With Regex');
    assertInputPrompt('Filter to lines not matching: ');
    setInputValue('[14]');
    press('Enter');
    assertDocumentTextTrimmed('2\n3\n2');
  });

  test('Exclude Lines With String', function() {
    setDocumentText(NUMBERS);
    runCommand('Filter Lines: Exclude Lines With String');
    assertInputPrompt('Filter to lines not containing: ');
    setInputValue('2');
    press('Enter');
    assertDocumentTextTrimmed('1\n3\n4');
  });
});

suite('Available shortcuts', function() {

  test('Include Lines With Regex', function() {
    press('Ctrl-K Ctrl-R');
    assertInputPrompt('Filter to lines matching: ');
  });

  test('Include Lines With String', function() {
    press('Ctrl-K Ctrl-S');
    assertInputPrompt('Filter to lines containing: ');
  });
});

suite('Word under cursor', function() {

  test('Should be suggested when there is no preserved search', function() {
    reloadWindow();
    setDocumentText('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus et feugiat libero. Curabitur porttitor');
    useConfiguration({ 'filterlines.preserve_search': true });

    putCursorTo('fe|ugiat');
    runCommand('Filter Lines: Include Lines With Regex');
    assertInputValue('feugiat');
    press('Esc');
  });

  test('Should not override preserved search', function() {
    reloadWindow();
    setDocumentText('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus et feugiat libero. Curabitur porttitor');
    useConfiguration({ 'filterlines.preserve_search': true });

    putCursorTo('fe|ugiat');
    runCommand('Filter Lines: Include Lines With Regex');
    assertInputValue('feugiat');
    press('Enter');
    closeDocument();

    putCursorTo('consecte|tur');
    runCommand('Filter Lines: Include Lines With Regex');
    assertInputValue('feugiat');
  });

  test('Should work better without preserved search', function() {
    reloadWindow();
    setDocumentText('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus et feugiat libero. Curabitur porttitor');
    useConfiguration({ 'filterlines.preserveSearch': false });

    putCursorTo('fe|ugiat');
    runCommand('Filter Lines: Include Lines With Regex');
    assertInputValue('feugiat');
    press('Enter');
    closeDocument();

    putCursorTo('consecte|tur');
    runCommand('Filter Lines: Include Lines With Regex');
    assertInputValue('consectetur');
  });
});

suite('Preserve search', function() {

  test('Search is preserved', function() {
    reloadWindow();
    setDocumentText('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus et feugiat libero. Curabitur porttitor');
    useConfiguration({ 'filterlines.preserveSearch': true });

    runCommand('Filter Lines: Include Lines With Regex');
    setInputValue('ipsum');
    press('Enter');
    closeDocument();

    runCommand('Filter Lines: Include Lines With Regex');
    assertInputValue('ipsum');
  });

  test('Search is not preserved when cancelled', function() {
    reloadWindow();
    setDocumentText('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus et feugiat libero. Curabitur porttitor');
    useConfiguration({ 'filterlines.preserveSearch': true });

    runCommand('Filter Lines: Include Lines With Regex');
    setInputValue('ipsum');
    press('Enter');
    closeDocument();

    runCommand('Filter Lines: Include Lines With Regex');
    settInputValue('dolor');
    press('Esc');

    runCommand('Filter Lines: Include Lines With Regex');
    assertInputValue('ipsum');
  });

  test('Preserved search is the same for string and regex search', function() {
    reloadWindow();
    setDocumentText('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus et feugiat libero. Curabitur porttitor');
    useConfiguration({ 'filterlines.preserveSearch': true });

    runCommand('Filter Lines: Include Lines With Regex');
    setInputValue('ipsum');
    press('Enter');
    closeDocument();

    runCommand('Filter Lines: Exclude Lines With String');
    assertInputValue('ipsum');
  });

  test('Search is not preserved after window is closed', function() {
    reloadWindow();
    setDocumentText('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus et feugiat libero. Curabitur porttitor');
    useConfiguration({ 'filterlines.preserveSearch': true });

    runCommand('Filter Lines: Include Lines With Regex');
    setInputValue('ipsum');
    press('Enter');
    closeDocument();

    reloadWindow();
    setDocumentText('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus et feugiat libero. Curabitur porttitor');
    runCommand('Filter Lines: Include Lines With Regex');
    assertInputValueNot('ipsum');  // should actually be the word under cursor, but that's for a different test suite
  });

});

suite('Case sensitivity', function() {

  test('String search', function() {
    setDocumentText('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus et feugiat libero. Curabitur porttitor');
    useConfiguration({ 'filterlines.caseSensitiveStringSearch': false, 'filterlines.caseSensitiveRegexSearch': true });  // defaults

    runCommand('Filter Lines: Include Lines With String');
    setInputValue('Ipsum');
    press('Enter');
    assertDocumentTextTrimmedNot('');
    closeDocument();

    useConfiguration({ 'filterlines.caseSensitiveStringSearch': true, 'filterlines.caseSensitiveRegexSearch': true });

    runCommand('Filter Lines: Include Lines With String');
    setInputValue('Ipsum');
    press('Enter');
    assertDocumentTextTrimmed('');
  });

  test('Regex search', function() {
    setDocumentText('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus et feugiat libero. Curabitur porttitor');
    useConfiguration({ 'filterlines.caseSensitiveStringSearch': false, 'filterlines.caseSensitiveRegexSearch': true });  // defaults

    runCommand('Filter Lines: Include Lines With Regex');
    setInputValue('Ipsum');
    press('Enter');
    assertDocumentTextTrimmed('');
    closeDocument();

    useConfiguration({ 'filterlines.caseSensitiveStringSearch': false, 'filterlines.caseSensitiveRegexSearch': false });

    runCommand('Filter Lines: Include Lines With Regex');
    setInputValue('Ipsum');
    press('Enter');
    assertDocumentTextTrimmedNot('');
  });
});

suite('Line numbers', function() {

  test('Line numbers', function() {
    setDocumentText(NUMBERS);
    useConfiguration({ 'filterlines.lineNumbers': true });

    runCommand('Filter Lines: Include Lines With String');
    setInputValue('2');
    press('Enter');
    assertDocumentTextTrimmed(`
    1: 2
    3: 2
`);
  });

  test('Line numbers with inverted search', function() {
    setDocumentText(NUMBERS);
    useConfiguration({ 'filterlines.lineNumbers': true });

    runCommand('Filter Lines: Exclude Lines With String');
    setInputValue('2');
    press('Enter');
    assertDocumentTextTrimmed(`
    0: 1
    2: 3
    4: 4
`);
  });
});

suite('In-place filtering', function() {
  // Tests operation under `"createNewTab": false`

  test('In-place filtering', function() {
    setDocumentText(NUMBERS);
    useConfiguration({ 'filterlines.createNewTab': false });

    runCommand('Filter Lines: Include Lines With String');
    setInputValue('2');
    press('Enter');
    assertDocumentCount(1);
    assertDocumentTextTrimmed('2\n2');
  });

  test('In-place filtering with inverted search', function() {
    setDocumentText(NUMBERS);
    useConfiguration({ 'filterlines.createNewTab': false });

    runCommand('Filter Lines: Exclude Lines With String');
    setInputValue('2');
    press('Enter');
    assertDocumentCount(1);
    assertDocumentTextTrimmed('1\n3\n4');
  });

  test('In-place filtering with line numbers', function() {
    setDocumentText(NUMBERS);
    useConfiguration({ 'filterlines.createNewTab': false, 'filterlines.lineNumbers': true });

    runCommand('Filter Lines: Include Lines With String');
    setInputValue('2');
    press('Enter');
    assertDocumentCount(1);
    assertDocumentTextTrimmed(`
    1: 2
    3: 2
`);
  });

  test('In-place filtering with inverted search and line numbers', function() {
    setDocumentText(NUMBERS);
    useConfiguration({ 'filterlines.createNewTab': false, 'filterlines.lineNumbers': true });

    runCommand('Filter Lines: Exclude Lines With String');
    setInputValue('2');
    press('Enter');
    assertDocumentCount(1);
    assertDocumentTextTrimmed(`
    0: 1
    2: 3
    4: 4
`);
  });
});
