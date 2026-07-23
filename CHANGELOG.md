# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-07-23

Changed:
  - Radically new interface: a dedicated **Filter Lines** view in the Activity Bar (a WebView form) replaces the previous set of separate commands and step-by-step input boxes. Search text, string/regex, case sensitivity, include/exclude, output mode and context are now all configured in one place.
  - The form remembers its full state between runs (search text, options and a search history navigated with the up/down arrows), so the previous configuration settings are no longer needed and have been removed.

Added:
  - New **Fold** output mode: instead of filtering, keep the whole file and fold the non-matching lines, so a log can be collapsed to the relevant places and expanded in context ([#35](https://github.com/earshinov/vscode-filter-lines/issues/35)).

Removed:
  - The eight `filterlines.*` commands and their keybindings, and all `filterlines.*` configuration settings. Filtering is now driven from the view. The programmatic `filterlines.filterLines` command remains available.

## [1.1.0] - 2023-08-27

Changed:
  - When `"lineNumbers"` setting is set to `true`, line numbers start with 1 rather than 0 ([#26](https://github.com/earshinov/vscode-filter-lines/issues/26))

## [1.0.0] - 2021-05-03

Fixed:
  - Don't collapse existing fold sections when filtering without context ([#9](https://github.com/earshinov/vscode-filter-lines/issues/9))

## [0.2.0] - 2020-07-10

Fixed:
  - Preserving search input

Added:
  - "... with Context" commands (see README)

Maintenance:
  - Hugely improved the development environment.  Covered the codebase with tests, configured continuous integration (Travis CI + Coverall).

## [0.1.0] - 2019-10-20

Initial release
