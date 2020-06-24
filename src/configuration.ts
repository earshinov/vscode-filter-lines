import vscode from 'vscode';


export interface IConfiguration<T extends {[key: string]: any}> {

  get<TKey extends keyof T>(key: TKey): T[TKey];
}


/* istanbul ignore next */
export class VscodeWorkspaceConfiguration<T extends {[key: string]: any}> implements IConfiguration<T> {

  constructor(private readonly config: vscode.WorkspaceConfiguration, private readonly defaults: Readonly<T>) { }

  // @override
  get<TKey extends keyof T>(key: TKey): T[TKey] { return this.config.get<T[TKey]>(key as string, this.defaults[key]); }
}


export class GivenConfiguration<T extends {[key: string]: any}> implements IConfiguration<T> {

  constructor(private readonly data: Readonly<T>) { }

  // @override
  get<TKey extends keyof T>(key: TKey): T[TKey] { return this.data[key]; }
}
