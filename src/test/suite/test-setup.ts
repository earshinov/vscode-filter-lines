import * as vscode from 'vscode';

import { DI } from '../../extension';
import { FAKE_CONFIGURATION, resetConfiguration, updateConfiguration } from './test-utils';


setup(async () => {

  // Use the fake configuration instead of tampering with global VS Code settings.
  // Otherwise, when you launch extension tests locally, vscode.workspace.getConfiguration() will
  // use your actual global VS Code configuration, which looks like an oversight on VS Code's part.
  DI.getConfiguration = () => FAKE_CONFIGURATION;

  // Start each test with pristine configuraiton.
  // `createNewTab: false` is more convenient for testing than the default `true`.
  resetConfiguration();
  updateConfiguration({ createNewTab: false });

  // Always use \n line endings to make document content comparisons predictable
  const editor = vscode.window.activeTextEditor!;
  await editor.edit(edit => {
    edit.setEndOfLine(vscode.EndOfLine.LF);
  });
});
