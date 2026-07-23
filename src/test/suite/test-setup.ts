import vscode from 'vscode';

import { closeAllEditors } from './support';


suiteSetup(async () => {
  // Force activation so activate()'s command/view registration runs (and is covered)
  // before the first test, regardless of which suite runs first.
  const ext = vscode.extensions.getExtension('earshinov.filter-lines');
  if (ext && !ext.isActive)
    await ext.activate();
});

// Each test opens the documents it needs; start and end from a clean slate.
setup(closeAllEditors);
teardown(closeAllEditors);
