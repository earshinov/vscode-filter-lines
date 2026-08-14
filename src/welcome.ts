import vscode from 'vscode';


export const WELCOME_SHOWN_KEY = 'filterLines.welcome.v2Shown';


// Shown once to every user, including fresh installs: VS Code does not expose the
// previously installed extension version, so upgrades from v1 cannot be detected.
export async function showWelcome(context: vscode.ExtensionContext): Promise<void> {
  if (context.globalState.get<boolean>(WELCOME_SHOWN_KEY))
    return;

  const uri = vscode.Uri.joinPath(context.extensionUri, 'WELCOME.md');
  await vscode.commands.executeCommand('markdown.showPreview', uri);
  await context.globalState.update(WELCOME_SHOWN_KEY, true);
}
