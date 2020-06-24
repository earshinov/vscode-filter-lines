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
  // `createNewTab: false` is more convenient for testing than the default `true`.
  REGISTRY.reset();
  REGISTRY.updateConfiguration({ createNewTab: false });

  // Open a single blank editor
  while (vscode.window.activeTextEditor)
     await closeEditor();
  const editor = await openEditor();

  // Always use \n line endings to make document content comparisons predictable
  await editor.edit(edit => {
    edit.setEndOfLine(vscode.EndOfLine.LF);
  });
});
