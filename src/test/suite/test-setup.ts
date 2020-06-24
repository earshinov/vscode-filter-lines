import vscode from 'vscode';

import { DI } from '../../extension';
import { REGISTRY } from './test-di';
import { openEditor, closeEditor } from './test-utils';


suiteSetup(() => {

  // Inject mock dependencies
  DI.getRegistry = () => REGISTRY;
});


setup(async () => {

  // Start each test with pristine configuration.
  REGISTRY.reset();
  // Apply some settings which will be our defaults while running tests.
  REGISTRY.updateSettings({
    createNewTab: false,
    indentContext: false,
    foldIndentedContext: false,
  });

  // Open a single blank editor
  while (vscode.window.activeTextEditor)
     await closeEditor();
  const editor = await openEditor();

  // Use given line endings and indentation to make document content comparisons predictable
  editor.options.tabSize = 2;
  editor.options.insertSpaces = true;
  await editor.edit(edit => {
    edit.setEndOfLine(vscode.EndOfLine.LF);
  });
});
