# Manual test scenarios

Manual smoke tests for the 2.0.0 Filter Lines view. The automated test suite has
not been ported yet (see [`TODO.md`](../../TODO.md)), so run these by hand before
publishing.

## Setup

1. Build the extension: `yarn build`.
2. Press `F5` in VS Code to launch the Extension Development Host.
3. Open the **Filter Lines** view from the Activity Bar (or press `Ctrl-K Ctrl-R`
   / `Cmd-K Cmd-R` to focus it).
4. Open one of the fixture files from this folder in an editor tab, then switch
   focus to the view and run a scenario.

> The view acts on the **last active text editor**. Open a fixture, then click
> into the view — filtering still targets that editor.

## Fixtures

| File | Purpose |
|------|---------|
| [`numbers.txt`](numbers.txt) | Deterministic content for exact-output checks (mirrors the automated tests). |
| [`sample.log`](sample.log) | App log with `INFO` / `DEBUG` / `WARN` / `ERROR` lines and stack traces — good for regex, context and Fold. |
| [`access_log.txt`](access_log.txt) | CLF access log — good for regex on status codes / paths. |

`numbers.txt` (0-based line → value):

```
0:0  1:1  2:2  3:2  4:2  5:3  6:4  7:5  8:6  9:2  10:4
```

---

## Scenarios

### 1. String search — Include (New tab)

- Fixture: `numbers.txt`. Output mode: **New tab**. `.*` **off** (string). Case **off**. Context **0**. Action **Include**.
- Search `2`, press **Enter**.
- Expected: a new tab opens containing exactly:
  ```
  2
  2
  2
  2
  ```

### 2. Regex search — Include (New tab)

- Fixture: `sample.log`. Output: **New tab**. `.*` **on** (regex). `Aa` **on** (case-sensitive). Action **Include**.
- Search `ERROR|WARN`.
- Expected: 5 lines — the two `ERROR` lines and the three `WARN` lines, in original order.
- Note: with `Aa` **off** you also match `... Job finished with errors` (the lowercase `errors`), giving 6 lines — a good way to see the case toggle take effect.

### 3. Case sensitivity (`Aa`)

- Fixture: `sample.log`. Output: **New tab**. `.*` **off** (string). Search `error`.
- With `Aa` **off** (case-insensitive): matches 3 lines — both `ERROR ...` lines and `... finished with errors`.
- With `Aa` **on** (case-sensitive): matches only 1 line — `... Job finished with errors` (lowercase `error`). The uppercase `ERROR` lines are excluded.

### 4. Include vs Exclude

- Fixture: `numbers.txt`. Output: **New tab**. String. Search `2`.
- **Include** → four `2` lines (scenario 1).
- **Exclude** → all lines except the `2`s:
  ```
  0
  1
  3
  4
  5
  6
  4
  ```

### 5. Output — In-place

- Fixture: `numbers.txt`. Output: **In-place**. String. Search `2`. Include.
- Expected: the current document is replaced with the four `2` lines. Press `Ctrl-Z` to confirm the edit is a single undoable change that restores the original content.

### 6. Output — Fold (issue #35), no context

- Fixture: `sample.log`. Output: **Fold**. Regex. `Aa` **on** (case-sensitive). Search `ERROR`. Context **0**.
- Expected: the file is **not** modified. Every non-matching run is folded **under the preceding kept line**, so the visible lines are: the first line of the file (line 1, `Starting service`, collapsed with a `⋯` — the leading run has no kept line to hang under) plus the two `ERROR` lines (7 and 14), each showing a `⋯` for the lines hidden beneath it. No other non-matching lines are visible. Click a fold marker to expand it — the original lines are intact.
- Note: `Aa` **on** keeps this to the two uppercase `ERROR` lines; with `Aa` off the lowercase `errors` line also matches (its run folds differently).
- Note: a trailing empty last line may remain visible (an empty line can't be pulled into the fold); this is expected.

### 7. Output — Fold with context

- Same as scenario 6 (including `Aa` **on**) but Context **2**.
- Expected: each `ERROR` line stays visible together with the 2 lines above and below it (including the `at ...` stack-trace lines). The remaining non-matching runs are folded, each anchored under the last visible context line (the fold marker `⋯` sits on that context line).
- Re-run with a different search (e.g. `WARN`) and confirm the previous folds are cleared before the new ones are applied.

### 8. Context lines (exact)

- The **Context** control is the small number box to the right of the `Aa` / `.*`
  toggles (hover it for the tooltip); it has no visible label.
- Fixture: `numbers.txt`. Output: **New tab**. String. Search `2`. Context **1**. Include.
- Expected:
  ```
  1
  2
  2
  2
  3
  6
  2
  4
  ```
  (overlapping context around adjacent matches is merged, not duplicated).

### 9. Add line numbers

- Fixture: `numbers.txt`. Output: **New tab**. String. Search `2`. Context **0**. **Add line numbers on**.
- Expected (1-based, padded to 5 columns):
  ```
      3: 2
      4: 2
      5: 2
     10: 2
  ```
- Switch Output to **Fold**: the **Add line numbers** checkbox becomes disabled (the editor gutter keeps the real numbers).

### 10. Search history (`↑` / `↓`)

- Run several different searches (e.g. `2`, then `4`, then `ERROR`).
- Put the cursor in the search box and press `↑`: it cycles back through previous searches (most recent first); `↓` moves forward and finally back to an empty field.

### 11. State persistence

- Set a distinctive configuration (e.g. regex on, Exclude, Fold, context 3, some search text).
- Run **Developer: Reload Window**.
- Expected: the view reopens with all fields, and the search history, exactly as left.

### 12. Invalid regex

- `.*` **on**. Search `[` (unterminated group). Press Enter.
- Expected: no filtering happens and the document is unchanged. The search box border turns red (`inputValidation.errorBorder`) and a validation message "Invalid regular expression: ..." appears below it.
- Start typing: the red border and the message disappear immediately.

### 13. No editor open

- Close all editor tabs, keep only the view. Press **Filter**.
- Expected: an information notification "Filter Lines: open a file to filter first."

### 14. Empty search (invalid input)

- Fixture: `numbers.txt`. Leave the search box empty and press **Filter** (or Enter).
- Expected: no filtering happens. The search box border turns red (`inputValidation.errorBorder`) and a validation message "Enter a search pattern." appears below it.
- Start typing: the red border and the message disappear immediately.

### 15. Activity Bar + keybinding

- Confirm the Filter Lines icon appears in the Activity Bar and opens the view.
- With the view closed, run **Focus on Filter Lines View** from the Command Palette → the view is focused.
  (There's no default keybinding; users can assign their own in Keyboard Shortcuts.)
- The `Aa` / `.*` toggles are reachable with `Tab` and activated with `Enter` / `Space`
  (there are no dedicated Alt shortcuts — a webview can't suppress the VS Code menu-bar Alt
  mnemonics, so `Alt+R` etc. would both toggle and open a menu). Both toggles persist across a window reload.

### 16. Access log (ad-hoc regex)

- Fixture: `access_log.txt`. Regex. Search `" [45]\d\d ` to keep 4xx/5xx responses; or `/api/` to keep API calls.
- Try each output mode and confirm results look right (no exact assertion — sanity check).
