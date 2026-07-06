// Type stub for eslint — replace with `npm i -D @types/eslint` once available.
// This prevents implicit-any errors from ESLint's untyped return values.
declare module 'eslint' {
  export interface LintMessage {
    ruleId: string | null;
    severity: number;
    message: string;
    line: number;
    column: number;
    nodeType: string | null;
    endLine?: number;
    endColumn?: number;
    fix?: { range: [number, number]; text: string };
  }

  export interface LintResult {
    filePath: string;
    messages: LintMessage[];
    errorCount: number;
    warningCount: number;
    fixableErrorCount: number;
    fixableWarningCount: number;
    source?: string;
  }

  export class ESLint {
    constructor(options?: { useEslintrc?: boolean; fix?: boolean; [key: string]: unknown });
    lintFiles(patterns: string[]): Promise<LintResult[]>;
    lintText(code: string, options?: { filePath?: string }): Promise<LintResult[]>;
    static outputFixes(results: LintResult[]): Promise<void>;
  }
}
