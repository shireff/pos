declare module 'puppeteer' {
  export interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }

  export interface Page {
    setContent(html: string, options?: Record<string, unknown>): Promise<void>;
    pdf(options?: Record<string, unknown>): Promise<Buffer>;
  }

  export function launch(options?: Record<string, unknown>): Promise<Browser>;
}
