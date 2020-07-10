declare module 'nyc' {
  export default class NYC {
    constructor(args: {[key: string]: any});
    createTempDirectory(): Thenable<void>;
    writeCoverageFile(): Thenable<void>;
  }
}

declare module 'nyc/lib/config-util' {
  function configUtil(cwd?: string): Thenable<any>;
  export = configUtil;
}
