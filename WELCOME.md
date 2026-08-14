# <img src="media/logo.png" alt="Filter Lines logo" style="height: 1em; position: relative; bottom: -0.15em;"> Welcome to Filter Lines v2

Filter Lines now puts search options and output controls in one Activity Bar
view.

## Quick start

1. Open the text file you want to filter.
2. Select <img src="media/icon.png" alt="Filter Lines icon" style="height: 1.1em; position: relative; bottom: -0.15em;">
   **Filter Lines** in the Activity Bar, or use **Command Palette** (`Ctrl-Shift-P`) → **Focus on Filter Lines View**.

<!--
Reuse the Quick start screenshot from README.md here:
![Filter Lines view](media/screenshots/filter-lines-view.png)
-->

![Filter Lines view](media/screenshots/filter-lines-view.png)

**New in v2:** Use **Fold** mode to collapse non-matching lines instead of filtering them out.

<!--
Reuse the Fold screenshots from README.md here:
![Before using Fold mode](media/screenshots/filter-lines-fold-before.png)
![After using Fold mode](media/screenshots/filter-lines-fold-after.png)
-->

<p>
  <img src="media/screenshots/filter-lines-fold-before.png" alt="Before using Fold mode" width="49%">
  <img src="media/screenshots/filter-lines-fold-after.png" alt="After using Fold mode" width="49%">
</p>

See [README](README.md) for full documentation.

## Upgrading from 1.x

<!-- Keep this section in sync with "Upgrading from 1.x" in README.md. -->

Version 2 replaces the separate commands and prompt sequence with the Filter
Lines view:

- The eight variants of the Include / Exclude commands have been replaced by
  controls in the view.
- The old `filterlines.*` settings have been removed. Search type, case
  sensitivity, output mode, context, and line numbers are selected in the form
  and remembered automatically.
- The default `Ctrl-K Ctrl-R` and `Ctrl-K Ctrl-S` keybindings have been removed.
  You can assign a keybinding to **Focus on Filter Lines View** in Keyboard
  Shortcuts.
- The old New tab / In-place choice is now joined by **Fold**, which collapses
  irrelevant ranges without modifying the file.
- Indented context has been removed; consider using **Fold** mode instead.

Review [Breaking changes](README.md#breaking-changes-since-v1) if you use any of the `filterlines.*` commands in your custom keybindings.
