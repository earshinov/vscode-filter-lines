// @ts-check

/** @typedef {import('../src/messages').FormState} FormState */
/** @typedef {import('../src/messages').WebviewToExtension} WebviewToExtension */
/** @typedef {import('../src/messages').ExtensionToWebview} ExtensionToWebview */

(function () {
  const vscode = acquireVsCodeApi();

  /** @param {WebviewToExtension} message */
  function post(message) {
    vscode.postMessage(message);
  }

  /** @type {FormState} */
  const DEFAULT_STATE = {
    needle: '',
    caseSensitive: false,
    useRegex: true,
    action: 'include',
    outputMode: 'newtab',
    context: 0,
    lineNumbers: false,
    history: [],
  };

  /** @type {FormState} */
  let state = Object.assign({}, DEFAULT_STATE, vscode.getState() || {});

  // Transient (not persisted) index into the history while navigating with arrows.
  /** @type {number | null} */
  let historyIndex = null;

  const els = {
    needle: /** @type {HTMLInputElement} */ (document.getElementById('needle')),
    searchBox: /** @type {HTMLElement} */ (document.getElementById('search-box')),
    searchValidation: /** @type {HTMLElement} */ (document.getElementById('search-validation')),
    toggleCase: /** @type {HTMLButtonElement} */ (document.getElementById('toggle-case')),
    toggleRegex: /** @type {HTMLButtonElement} */ (document.getElementById('toggle-regex')),
    action: /** @type {HTMLElement} */ (document.getElementById('action')),
    output: /** @type {HTMLElement} */ (document.getElementById('output')),
    context: /** @type {HTMLInputElement} */ (document.getElementById('context')),
    lineNumbers: /** @type {HTMLInputElement} */ (document.getElementById('line-numbers')),
    lineNumbersRow: /** @type {HTMLElement} */ (document.getElementById('line-numbers-row')),
    filter: /** @type {HTMLButtonElement} */ (document.getElementById('filter')),
  };

  function persist() {
    vscode.setState(state);
    post({ type: 'persist', state: state });
  }

  function render() {
    els.needle.value = state.needle;
    els.needle.placeholder = state.useRegex ? 'matching regex…' : 'containing text…';

    els.toggleCase.classList.toggle('search--toggle-active', !!state.caseSensitive);
    els.toggleRegex.classList.toggle('search--toggle-active', !!state.useRegex);

    for (const btn of els.action.querySelectorAll('.buttonGroup--button'))
      btn.classList.toggle('buttonGroup--button-active', btn.getAttribute('data-value') === state.action);

    for (const btn of els.output.querySelectorAll('.buttonGroup--button'))
      btn.classList.toggle('buttonGroup--button-active', btn.getAttribute('data-value') === state.outputMode);

    els.context.value = String(state.context);

    const foldMode = state.outputMode === 'fold';
    els.lineNumbers.checked = !!state.lineNumbers && !foldMode;
    els.lineNumbers.disabled = foldMode;
    els.lineNumbersRow.classList.toggle('checkboxRow-disabled', foldMode);
  }

  /**
   * @param {Record<string, any>} patch
   * @param {boolean} [doPersist]
   */
  function update(patch, doPersist = true) {
    state = Object.assign({}, state, patch);
    render();
    if (doPersist)
      persist();
  }

  /** @param {string | null} message */
  function setValidation(message) {
    els.searchBox.classList.toggle('search--box-invalid', message != null);
    els.searchValidation.hidden = message == null;
    els.searchValidation.textContent = message || '';
  }

  function runFilter() {
    const needle = els.needle.value;
    if (!needle) {
      setValidation('Enter a search pattern.');
      els.needle.focus();
      return;
    }
    setValidation(null);
    const history = (state.history || []).filter((/** @type {string} */ s) => s !== needle);
    if (needle)
      history.push(needle);
    while (history.length > 20)
      history.shift();
    historyIndex = null;
    update({ needle: needle, history: history });
    post({ type: 'filter', state: state });
  }

  // --- Wiring ---

  els.needle.addEventListener('input', () => {
    historyIndex = null;
    setValidation(null);
    update({ needle: els.needle.value });
  });

  els.needle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runFilter();
      return;
    }
    const history = state.history || [];
    if (e.key === 'ArrowUp') {
      if (history.length === 0)
        return;
      e.preventDefault();
      historyIndex = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      els.needle.value = history[historyIndex];
      update({ needle: els.needle.value });
    }
    else if (e.key === 'ArrowDown') {
      if (historyIndex === null)
        return;
      e.preventDefault();
      if (historyIndex >= history.length - 1) {
        historyIndex = null;
        els.needle.value = '';
      }
      else {
        historyIndex += 1;
        els.needle.value = history[historyIndex];
      }
      update({ needle: els.needle.value });
    }
  });

  els.toggleCase.addEventListener('click', () => update({ caseSensitive: !state.caseSensitive }));
  els.toggleRegex.addEventListener('click', () => update({ useRegex: !state.useRegex }));

  els.action.addEventListener('click', (e) => {
    const btn = /** @type {HTMLElement} */ (e.target).closest('.buttonGroup--button');
    if (btn)
      update({ action: btn.getAttribute('data-value') });
  });

  els.output.addEventListener('click', (e) => {
    const btn = /** @type {HTMLElement} */ (e.target).closest('.buttonGroup--button');
    if (btn)
      update({ outputMode: btn.getAttribute('data-value') });
  });

  els.context.addEventListener('input', () => {
    const n = Math.max(0, parseInt(els.context.value, 10) || 0);
    update({ context: n });
  });

  els.lineNumbers.addEventListener('change', () => {
    if (!els.lineNumbers.disabled)
      update({ lineNumbers: els.lineNumbers.checked });
  });

  els.filter.addEventListener('click', runFilter);

  window.addEventListener('message', (event) => {
    const message = /** @type {ExtensionToWebview} */ (event.data);
    if (!message)
      return;
    switch (message.type) {
      case 'restore':
        state = Object.assign({}, DEFAULT_STATE, message.state);
        vscode.setState(state);
        render();
        return;
      case 'invalid':
        setValidation(message.message || 'Invalid search pattern.');
        els.needle.focus();
        return;
    }
  });

  // Initial paint + ask the extension for the authoritative persisted state.
  render();
  post({ type: 'ready' });
}());
