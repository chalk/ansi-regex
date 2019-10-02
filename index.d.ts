// TypeScript Version: 3.5.2

interface Options {
  onlyFirst: boolean;
}

declare function ansiRegex<T>(options?: Options | T): RegExp;

export = ansiRegex;
