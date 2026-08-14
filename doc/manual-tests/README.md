# Manual test scenarios

The filtering logic and editor integration of the 2.0.0 Filter Lines view are covered by the automated suite (`yarn test`).
These scenarios deliberately focus on what automation can't reach: the webview UI/UX and the visual VS Code integration (fold markers, inline validation styling, keyboard navigation, reload persistence).

## Setup

1. Build the extension: `yarn build`.
2. Press `F5` in VS Code to launch the Extension Development Host.
3. Open the **Filter Lines** view from the Activity Bar (or run **Focus on Filter Lines View** from the Command Palette).
4. Open one of the fixture files from [`../sample-files`](../sample-files) in an
   editor tab, then switch focus to the view and run a scenario.

> The view acts on the **last active text editor**. Open a fixture, then click into the view — filtering still targets that editor.

## Fixtures

| File | Purpose |
|------|---------|
| [`../sample-files/numbers.txt`](../sample-files/numbers.txt) | Small deterministic fixture for the in-place / line-number / empty-search scenarios. |
| [`../sample-files/sample.log`](../sample-files/sample.log) | App log with `INFO` / `DEBUG` / `WARN` / `ERROR` lines and stack traces — good for regex, context and Fold. |
| [`../sample-files/access.log`](../sample-files/access.log) | CLF access log — good for regex on status codes / paths. |

## Scenarios

The core filtering behaviors (include/exclude, string/regex, case, context, line numbers, output modes, invalid regex, no-editor) are verified by the automated suite.
Run one quick end-to-end search below to confirm the webview actually drives the extension, then focus on the UI/visual checks.

### 1. End-to-end search sanity (regex + case toggle)

- Fixture: `sample.log`. Output: **New tab**. `.*` **on** (regex). `Aa` **on** (case-sensitive). Action **Include**.
- Type `ERROR|WARN` in the box and press **Enter**.
- Expected: a new tab with 5 lines — the two `ERROR` lines and the three `WARN` lines, in original order.
- Toggle `Aa` **off** and re-run: you also match `... Job finished with errors` (lowercase), giving 6 lines — confirms the toggle drives a real re-filter.

### 2. In-place edit is a single undo

- Fixture: `numbers.txt`. Output: **In-place**. String. Search `2`. Include.
- Expected: the document is replaced with the four `2` lines.
- Press `Ctrl-Z` once → the original content is fully restored in a single undo step.

### 3. Fold (issue #35), no context — visuals

- Fixture: `sample.log`. Output: **Fold**. Regex. `Aa` **on**. Search `ERROR`. Context **0**.
- Expected: the file is **not** modified. Every non-matching run is folded **under the preceding kept line**, so the visible lines are: the first line of the file (the leading run has no kept line to hang under, so it stays as the fold header with a `⋯`) plus the two `ERROR` lines, each showing a `⋯` for the lines hidden beneath it.
- Click a fold marker (`⋯`) to expand it — the original lines are intact.
- Note: a trailing empty last line may remain visible (an empty line can't be pulled into the fold). This is expected.

### 4. Fold with context + folds cleared on re-run

- Same as scenario 3 (including `Aa` **on**) but Context **2**.
- Expected: each `ERROR` line stays visible with the 2 lines above/below (including `at ...` stack-trace lines). The remaining runs fold, each anchored under the last visible context line.
- Re-run with a different search (e.g. `WARN`) and confirm the **previous folds are cleared** before the new ones are applied.

### 5. Add line numbers — disabled in Fold mode

- Fixture: `numbers.txt`. Output: **New tab**. String. Search `2`. **Add line numbers on**.
- Expected: the new tab shows 1-based numbers padded to 5 columns (`    3: 2`, `    4: 2`, …).
- Switch Output to **Fold**: the **Add line numbers** checkbox becomes disabled (the editor gutter keeps the real numbers).

### 6. Search history (`↑` / `↓`)

- Run several different searches (e.g. `2`, then `4`, then `ERROR`).
- Put the cursor in the search box and press `↑`: it cycles back through previous searches (most recent first). `↓` moves forward and finally back to an empty field.

### 7. State persistence across reload

- Set a distinctive configuration (e.g. regex on, Exclude, Fold, context 3, some search text).
- Run **Developer: Reload Window**.
- Expected: the view reopens with all fields, and the search history, exactly as left.

### 8. Invalid regex — inline validation styling

- `.*` **on**. Search `[` (unterminated group). Press Enter.
- Expected: no filtering. The search box border turns red (`inputValidation.errorBorder`) and a message "Invalid regular expression: ..." appears below it.
- Start typing: the red border and the message disappear immediately.

### 9. Empty search — inline validation styling

- Fixture: `numbers.txt`. Leave the search box empty and press **Filter** (or Enter).
- Expected: no filtering. The box border turns red and a message "Enter a search pattern." appears below it.
- Start typing: the red border and the message disappear immediately.

### 10. Activity Bar + keyboard navigation

- Confirm the Filter Lines icon appears in the Activity Bar and opens the view.
- With the view closed, run **Focus on Filter Lines View** from the Command Palette → the view is focused. (There's no default keybinding. Users can assign their own in Keyboard Shortcuts.)
- The `Aa` / `.*` toggles are reachable with `Tab` and activated with `Enter` / `Space` (there are no dedicated Alt shortcuts — a webview can't suppress the VS Code menu-bar Alt mnemonics, so `Alt+R` etc. would both toggle and open a menu). Both toggles persist across a window reload.

### 11. Access log (ad-hoc regex, exploratory)

- Fixture: `access.log`. Regex. Search `" [45]\d\d ` to keep 4xx/5xx responses, or `/api/` to keep API calls.
- Try each output mode and confirm results look right (no exact assertion — sanity check).
