import { ESLint } from 'eslint';
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

interface LintMessage {
  message: string;
  ruleId: string | null;
  severity: number;
}

interface LintResult {
  filePath: string;
  errorCount: number;
  messages: LintMessage[];
}

describe('Layer Boundary Lint Enforcement', () => {
  const eslint = new ESLint({
    useEslintrc: true,
  });

  const rootDir = path.resolve(__dirname, '..');

  const filesToCreate = {
    domainCatalogFile: path.join(rootDir, 'packages/domain/catalog/src/temp-catalog-entity.ts'),
    appSalesFile: path.join(rootDir, 'packages/application/sales/src/temp-sales-use-case.ts'),
    appIdentityFile: path.join(
      rootDir,
      'packages/application/identity/src/temp-identity-use-case.ts',
    ),
    infraMongoFile: path.join(rootDir, 'packages/infrastructure/mongodb/src/temp-mongo-repo.ts'),
  };

  const createDirectories = (): void => {
    Object.values(filesToCreate).forEach((filePath) => {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  };

  const cleanup = (): void => {
    Object.values(filesToCreate).forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
      }
    });
  };

  it('blocks forbidden imports at layer boundaries and allows valid ones', async () => {
    cleanup();
    createDirectories();

    try {
      // 1. Domain layer importing mongodb → should FAIL lint
      fs.writeFileSync(
        filesToCreate.domainCatalogFile,
        `import { MongoClient } from 'mongodb';\nexport class CatalogEntity {}`,
      );

      // 2. Application layer importing react → should FAIL lint
      fs.writeFileSync(
        filesToCreate.appSalesFile,
        `import React from 'react';\nexport class SalesUseCase {}`,
      );

      // 3. Application layer importing @tauri-apps/api → should FAIL lint
      fs.writeFileSync(
        filesToCreate.appIdentityFile,
        `import { invoke } from '@tauri-apps/api';\nexport class IdentityUseCase {}`,
      );

      // 4. Infrastructure layer importing mongodb → should PASS lint
      fs.writeFileSync(
        filesToCreate.infraMongoFile,
        `import { MongoClient } from 'mongodb';\nexport class MongoRepo {}`,
      );

      const rawResults = await eslint.lintFiles(Object.values(filesToCreate));
      const results = rawResults as LintResult[];

      const domainResult = results.find((r) => r.filePath === filesToCreate.domainCatalogFile);
      const salesResult = results.find((r) => r.filePath === filesToCreate.appSalesFile);
      const identityResult = results.find((r) => r.filePath === filesToCreate.appIdentityFile);
      const infraResult = results.find((r) => r.filePath === filesToCreate.infraMongoFile);

      // Domain layer: must have errors for restricted import
      expect(domainResult?.errorCount).toBeGreaterThan(0);
      const domainMessages = domainResult?.messages.map((m) => m.message) ?? [];
      expect(
        domainMessages.some(
          (msg) => msg.includes('Domain layer cannot import') || msg.includes('restricted-imports'),
        ),
      ).toBe(true);

      // Application layer (sales): must have errors for restricted import
      expect(salesResult?.errorCount).toBeGreaterThan(0);
      const salesMessages = salesResult?.messages.map((m) => m.message) ?? [];
      expect(
        salesMessages.some(
          (msg) =>
            msg.includes('Application layer cannot import') || msg.includes('restricted-imports'),
        ),
      ).toBe(true);

      // Application layer (identity): must have errors for restricted import
      expect(identityResult?.errorCount).toBeGreaterThan(0);
      const identityMessages = identityResult?.messages.map((m) => m.message) ?? [];
      expect(
        identityMessages.some(
          (msg) =>
            msg.includes('Application layer cannot import') || msg.includes('restricted-imports'),
        ),
      ).toBe(true);

      // Infrastructure layer: must NOT have restricted-import errors
      const infraMessages = infraResult?.messages.map((m) => m.message) ?? [];
      const hasRestrictedImportError = infraMessages.some((msg) => msg.includes('cannot import'));
      expect(hasRestrictedImportError).toBe(false);
    } finally {
      cleanup();
    }
  });
});
