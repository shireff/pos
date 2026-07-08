import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { assertCatalogPermission } from './catalog-permissions';

describe('assertCatalogPermission', () => {
  it('allows the required permission from the request header', async () => {
    const request = new NextRequest('http://localhost/api/v1/products', {
      headers: {
        'x-user-permissions': 'catalog.view,catalog.create',
      },
    });

    await expect(assertCatalogPermission(request, 'catalog.create')).resolves.toBeUndefined();
  });

  it('rejects missing permissions with a permission code', async () => {
    const request = new NextRequest('http://localhost/api/v1/products', {
      headers: {
        'x-user-permissions': 'catalog.view',
      },
    });

    await expect(assertCatalogPermission(request, 'catalog.edit')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      permissionCode: 'catalog.edit',
    });
  });
});
