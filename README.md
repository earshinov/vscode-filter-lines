# Filter Lines

[![Build Status](https://travis-ci.com/earshinov/vscode-filter-lines.svg?branch=master)](https://travis-ci.com/earshinov/vscode-filter-lines)

This extension allows to you to filter lines of the current document by a string or a regular expression.
It is basically a port of [Filter Lines][1] package for Sublime Text.

![Demo](doc/demo.gif)

## Available commands

All of the following commands are available in via Ctrl-Shift-P.

|Command|Default keybinding|
|-------|------------------|
|Filter Lines: Include Lines With Regex|Ctrl-K Ctrl-R|
|Filter Lines: Include Lines With String|Ctrl-K Ctrl-S|
|Filter Lines: Exclude Lines With Regex||
|Filter Lines: Exclude Lines With String||

On Mac, use <kbd>cmd</kbd> instead of <kbd>ctrl</kbd>

## Available settings

|Setting|Description|Default value|
|-------|-----------|-------------|
|caseSensitiveStringSearch|Makes searching by string case sensitive.  Instead of changing this setting to `true` you can use regexp search that is case sensitive by default.|`false`|
|caseSensitiveRegexSearch|Makes searching by regex case sensitive.|`true`|
|preserveSearch|Tells the extension to preserve the search string.|`true`|
|lineNumbers|Includes line numbers in filtered output.  Line numbers are 0-based and padded to 5 spaces.|`false`|
|createNewTab|Make this setting `false` to have filtered output displayed in-place rather than in a new tab.|`true`|

If you are using Settings UI, you will find these settings under "Filter Lines" section.

## Differences from the original Filter Lines

1. Folding is not supported due not VS Code API limitations.
2. Menu items are not provided, again due to VS Code API limitations.
3. With `"preserve_search": true` the search string is stored in memory rather than on disk and is cleared as soon as the VS Code window is closed.
4. With `"line_numbers": true` line numbers are appended even when the search is inverted (that is when an "Exclude…" command is used rather than an "Include…" one).

Happy filtering!

[1]: https://packagecontrol.io/packages/Filter%20Lines
