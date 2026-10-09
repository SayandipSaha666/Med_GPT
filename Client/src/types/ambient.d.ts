// Node.js type declarations for missing modules
declare module 'moment' {
  interface Moment {
    fromNow(): string;
  }
  function moment(input?: string | number | Date | Moment): Moment;
  namespace moment {
    export function locale(locale: string): void;
  }
  export default moment;
}

declare module 'markdown' {
  const markdown: (text: string) => string;
  export default markdown;
}

declare module 'prismjs' {
  export function highlightAll(): void;
}

declare module '*.png' {
  const source: string;
  export default source;
}

declare module '*.jpg' {
  const source: string;
  export default source;
}

declare module '*.svg' {
  const source: string;
  export default source;
}

// Vite client type declarations
interface ImportMetaEnv {
  readonly VITE_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
