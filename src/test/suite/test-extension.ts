import vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('extension.helloWorld command', async () => {
    await vscode.commands.executeCommand('extension.helloWorld');
  });
});
