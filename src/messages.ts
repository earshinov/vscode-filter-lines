import type { OutputMode } from './filter';

/**
 * The webview form state. It is the single source of truth for the shape
 * exchanged over `postMessage` and persisted on both sides (the extension's
 * `globalState` and the webview's `vscode.setState`).
 *
 * This module deliberately imports no `vscode` API so the webview
 * (`media/main.js`, type-checked with `checkJs`) can reference these types
 * through a JSDoc type-only import.
 */
export interface FormState {
  needle: string;
  caseSensitive: boolean;
  useRegex: boolean;
  action: 'include' | 'exclude';
  outputMode: OutputMode;
  context: number;
  lineNumbers: boolean;
  history: string[];
}

/** Messages sent from the webview to the extension. */
export type WebviewToExtension =
  | { type: 'ready' }
  | { type: 'persist'; state: FormState }
  | { type: 'filter'; state: FormState };

/** Messages sent from the extension to the webview. */
export type ExtensionToWebview =
  | { type: 'restore'; state: FormState }
  | { type: 'invalid'; message: string };
