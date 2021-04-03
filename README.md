# Filter Lines

[![Build Status](https://travis-ci.com/earshinov/vscode-filter-lines.svg?branch=master)](https://travis-ci.com/earshinov/vscode-filter-lines)
[![Coverage Status](https://coveralls.io/repos/github/earshinov/vscode-filter-lines/badge.svg?branch=master)](https://coveralls.io/github/earshinov/vscode-filter-lines?branch=master)

This extension allows to you to filter lines of the current document by a string or a regular expression.
It is basically a port of [Filter Lines][Filter Lines (Sublime Text plugin)] package for Sublime Text.

![Demo](doc/demo.gif)

## Available commands

All of the following commands are available via Ctrl-Shift-P.

|Command|Default keybinding|
|-------|------------------|
|Filter Lines: Include Lines with Regex|Ctrl-K Ctrl-R *|
|Filter Lines: Include Lines with String|Ctrl-K Ctrl-S *|
|Filter Lines: Exclude Lines with Regex||
|Filter Lines: Exclude Lines with String||
|Filter Lines: Include Lines with Regex and Context||
|Filter Lines: Include Lines with String and Context||
|Filter Lines: Exclude Lines with Regex and Context||
|Filter Lines: Exclude Lines with String and Context||

\* Use <kbd>cmd</kbd> instead of <kbd>ctrl</kbd> on Mac

"Regex" commands accept any regular expression valid in JavaScript, except that you cannot really match multiple lines.
See [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) for syntax reference, but
keep in mind that you only need to enter the *inner* part of the regex without the enclosing slashes (`/.../`)
which one would normally use in JavaScript.

"Context" commands additionally prompt you for the number of lines to include/exclude around a matching line, similarly to
`grep -A`, `-B`, `-C`.  Not that "exclude" commands apply context to the leftover lines rather than the matching lines,
which mimics `grep -v`.

## Available settings

|Setting|Description|Default value|
|-------|-----------|-------------|
|`caseSensitiveStringSearch`|Makes searching by string case sensitive.  Instead of changing this setting to `true` you can use regexp search that is case sensitive by default.|`false`|
|`caseSensitiveRegexSearch`|Makes searching by regex case sensitive.|`true`|
|`preserveSearch`|Tells the extension to preserve the search string.|`true`|
|`lineNumbers`|Includes line numbers in filtered output.  Line numbers are 0-based and padded to 5 spaces.|`false`|
|`createNewTab`|Set this setting to `false` to have filtered output displayed in-place rather than in a new tab.|`true`|
|`indentContext`|Controls how context lines are printed.  When `true`, context lines are placed below the corresponding matching line with additional indent, which works nicely with folding.  When `false`, matching lines and context lines are printed together like `grep -A`, `-B`, `-C` would do.|`true`|
|`foldIndentedContext`|Fold indented context automatically.  Only tekes effect when `indentContext` is `true`.|`true`|

If you are using Settings UI, you will find these settings under "Filter Lines" section.

## Under the hood: Available commands ids

You can use these command ids to make your own keybindings.

### # `filterlines.includeLinesWithRegex`

Implements the "Filter Lines: Include Lines with Regex" command.  Takes no arguments.

### # `filterlines.includeLinesWithString`

Implements the "Filter Lines: Include Lines with String" command.  Takes no arguments.

### # `filterlines.excludeLinesWithRegex`

Implements the "Filter Lines: Exclude Lines with Regex" command.  Takes no arguments.

### # `filterlines.excludeLinesWithString`

Implements the "Filter Lines: Exclude Lines with String" command.  Takes no arguments.

### # `filterlines.includeLinesWithRegexAndContext`

Implements the "Filter Lines: Include Lines with Regex and Context" command.  Takes no arguments.

### # `filterlines.includeLinesWithStringAndContext`

Implements the "Filter Lines: Include Lines with String and Context" command.  Takes no arguments.

### # `filterlines.excludeLinesWithRegexAndContext`

Implements the "Filter Lines: Exclude Lines with Regex and Context" command.  Takes no arguments.

### # `filterlines.excludeLinesWithStringAndContext`

Implements the "Filter Lines: Exclude Lines with String and Context" command.  Takes no arguments.

### # `filterlines.promptFilterLines`

Displays the necessary prompts and then performs the action specified in the arguments.

|Argument|Possible values|Default value|Description|
|--------|---------------|-------------|-----------|
|`search_type`|`"regex"` or `"string"`|`"regex"`|Defines the search type.|
|`invest_search`|`true` or `false`|`false`|Defines the action type.  By default the "Include" action is performed.  Set `invest_search` to `true` to perform the "Exclude" action.
|`with_context`|`true` or `false`|`false`|Controls whether to prompt for context.|
|`context`|any non-negative number|—|Defines the number of leading and trailing context lines.  Only takes effect if `with_context` is `false`.|
|`before_context`|any non-negative number|—|Defines the number of leading context lines, overriding `context` if it is given.  Only takes effect if `with_context` is `false`.|
|`after_context`|any non-negative number|—|Defines the number of trailing context lines, overriding `context` if it is given.  Only takes effect if `with_context` is `false`.|

### # `filterLines.filterLines`

Performs the action specified in the arguments with the given search string.  Arguments:

|Argument|Possible values|Default value|Description|
|--------|---------------|-------------|-----------|
|`search_type`|`"regex"` or `"string"`|`"regex"`|Defines the search type.|
|`invest_search`|`true` or `false`|`false`|Defines the action type.  By default the "Include" action is performed.  Set `invest_search` to `true` to perform the "Exclude" action.|
|`needle`|any string|`""`|Defines the search string, as in the "needle in a haystack" idiom.|
|`context`|any non-negative number|—|Defines the number of leading and trailing context lines.|
|`before_context`|any non-negative number|—|Defines the number of leading context lines, overriding `context` if it is given.|
|`after_context`|any non-negative number|—|Defines the number of trailing context lines, overriding `context` if it is given.|

## Differences from the original Filter Lines

1. Folding is not supported due not VS Code API limitations.
2. Menu items are not provided, again due to VS Code API limitations.
3. With `"preserve_search": true` the search string is stored in memory rather than on disk and is cleared as soon as the VS Code window is closed.
4. With `"line_numbers": true` line numbers are appended even when the search is inverted (that is when an "Exclude…" command is used rather than an "Include…" one).

You can find this extension both in the [Visual Studio Marketplace][] and in the [Open VSX Registry][].  Happy filtering!

[Filter Lines (Sublime Text plugin)]: https://packagecontrol.io/packages/Filter%20Lines
[Visual Studio Marketplace]: https://marketplace.visualstudio.com/
[Open VSX Registry]: https://open-vsx.org/
