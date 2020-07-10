import vscode from 'vscode';


export interface IStorage<T extends {[key: string]: any}> {

  get<TKey extends keyof T>(key: TKey): T[TKey];
  set<TKey extends keyof T>(key: TKey, value: T[TKey]): void;
}


/* istanbul ignore next */
export class VscodeGlobalStorage<T extends {[key: string]: any}> implements IStorage<T> {

  constructor(private readonly data: vscode.Memento, private readonly defaults: Readonly<T>) { }

  // @override
  get<TKey extends keyof T>(key: TKey): T[TKey] { return this.data.get(key as string, this.defaults[key]); }

  // @override
  set<TKey extends keyof T>(key: TKey, value: T[TKey]): void { this.data.update(key as string, value); }
}


export class GivenStorage<T extends {[key: string]: any}> implements IStorage<T> {

  constructor(private readonly data: T) { }

  // @override
  get<TKey extends keyof T>(key: TKey): T[TKey] { return this.data[key]; }

  // @override
  set<TKey extends keyof T>(key: TKey, value: T[TKey]): void { this.data[key] = value; }
}
