/**
 * Permission enforcement tests for catalog API endpoints.
 *
 * Verifies that every category and unit endpoint enforces its required
 * permission code via assertCatalogPermission.
 * No HTTP server — handlers are called directly.
 */
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Mock MongoDB ─────────────────────────────────────────────────────────────

vi.mock('../../../lib/mongo-catalog-repository', () => {
    const noop = vi.fn().mockResolvedValue(undefined);
    const empty = vi.fn().mockResolvedValue([]);
    const nil = vi.fn().mockResolvedValue(null);
    const no = vi.fn().mockResolvedValue(false);

    const CategoryRepo = vi.fn().mockImplementation(() => ({
        findAll: empty,
        findById: nil,
        findChildren: empty,
        hasActiveProducts: no,
        save: noop,
        saveAll: noop,
    }));

    const ProductRepo = vi.fn().mockImplementation(() => ({
        findById: nil,
    }));

    const UnitRepo = vi.fn().mockImplementation(() => ({
        findAll: empty,
        findById: nil,
        existsByAbbreviation: no,
        hasActiveProductReferences: no,
        save: noop,
    }));

    return {
        MongoCategoryRepository: CategoryRepo,
        MongoProductRepository: ProductRepo,
        MongoUnitRepository: UnitRepo,
    };
});

// ─── Import handlers after mocks ──────────────────────────────────────────────

const { GET: categoriesGET, POST: categoriesPOST } = await import('./categories/route');
const { PATCH: categoryPATCH, DELETE: categoryDELETE } = await import('./categories/[id]/route');
const { POST: categoryMove } = await import('./categories/[id]/move/route');
const { GET: unitsGET, POST: unitsPOST } = await import('./units/route');
const { PATCH: unitPATCH } = await import('./units/[id]/route');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function req(
    url: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    permissions: string[],
    body?: unknown,
): NextRequest {
    return new NextRequest(url, {
        method,
        headers: {
            'content-type': 'application/json',
            'x-user-permissions': permissions.join(','),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
}

function ctx(id: string): { params: Promise<{ id: string }> } {
    return { params: Promise.resolve({ id }) };
}

async function expectForbidden(
    response: Response,
    expectedPermissionCode: string,
): Promise<void> {
    expect(response.status).toBe(403);
    const body = await response.json() as {
        success: boolean;
        error: { code: string; permissionCode: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.permissionCode).toBe(expectedPermissionCode);
}

// ─── Categories ───────────────────────────────────────────────────────────────

describe('GET /api/v1/categories — catalog.view required', () => {
    it('rejects requests without catalog.view', async () => {
        const res = await categoriesGET(req('http://localhost/api/v1/categories', 'GET', []));
        await expectForbidden(res, 'catalog.view');
    });

    it('allows requests with catalog.view', async () => {
        const res = await categoriesGET(
            req('http://localhost/api/v1/categories?companyId=co-1', 'GET', ['catalog.view']),
        );
        expect(res.status).toBe(200);
    });
});

describe('POST /api/v1/categories — catalog.create required', () => {
    it('rejects requests without catalog.create', async () => {
        const res = await categoriesPOST(
            req('http://localhost/api/v1/categories', 'POST', ['catalog.view'], {
                name: { ar: 'فئة جديدة' },
            }),
        );
        await expectForbidden(res, 'catalog.create');
    });

    it('returns 400 when name.ar is absent (permission passes)', async () => {
        const res = await categoriesPOST(
            req('http://localhost/api/v1/categories', 'POST', ['catalog.create'], {
                name: { en: 'No Arabic name' },
            }),
        );
        expect(res.status).toBe(400);
    });
});

describe('PATCH /api/v1/categories/:id — catalog.edit required', () => {
    it('rejects requests without catalog.edit', async () => {
        const res = await categoryPATCH(
            req('http://localhost/api/v1/categories/cat-1', 'PATCH', ['catalog.view'], {
                name: { ar: 'اسم محدث' },
            }),
            ctx('cat-1'),
        );
        await expectForbidden(res, 'catalog.edit');
    });
});

describe('DELETE /api/v1/categories/:id — catalog.delete required', () => {
    it('rejects requests without catalog.delete', async () => {
        const res = await categoryDELETE(
            req('http://localhost/api/v1/categories/cat-1?companyId=co-1', 'DELETE', ['catalog.view']),
            ctx('cat-1'),
        );
        await expectForbidden(res, 'catalog.delete');
    });
});

describe('POST /api/v1/categories/:id/move — catalog.edit required', () => {
    it('rejects requests without catalog.edit', async () => {
        const res = await categoryMove(
            req('http://localhost/api/v1/categories/cat-1/move', 'POST', ['catalog.view'], {
                newParentId: null,
            }),
            ctx('cat-1'),
        );
        await expectForbidden(res, 'catalog.edit');
    });

    it('returns 400 when newParentId is absent from body (permission passes)', async () => {
        const res = await categoryMove(
            req('http://localhost/api/v1/categories/cat-1/move', 'POST', ['catalog.edit'], {}),
            ctx('cat-1'),
        );
        expect(res.status).toBe(400);
    });
});

// ─── Units ────────────────────────────────────────────────────────────────────

describe('GET /api/v1/units — catalog.view required', () => {
    it('rejects requests without catalog.view', async () => {
        const res = await unitsGET(req('http://localhost/api/v1/units', 'GET', []));
        await expectForbidden(res, 'catalog.view');
    });

    it('allows requests with catalog.view', async () => {
        const res = await unitsGET(
            req('http://localhost/api/v1/units?companyId=co-1', 'GET', ['catalog.view']),
        );
        expect(res.status).toBe(200);
    });
});

describe('POST /api/v1/units — catalog.create required', () => {
    it('rejects requests without catalog.create', async () => {
        const res = await unitsPOST(
            req('http://localhost/api/v1/units', 'POST', ['catalog.view'], {
                companyId: 'co-1',
                name: { ar: 'قطعة' },
                abbreviation: 'pcs',
                isBaseUnit: true,
                conversionFactorToBase: 1,
            }),
        );
        await expectForbidden(res, 'catalog.create');
    });

    it('returns 400 when required fields are missing (permission passes)', async () => {
        const res = await unitsPOST(
            req('http://localhost/api/v1/units', 'POST', ['catalog.create'], {
                name: { ar: 'قطعة' },
                // missing abbreviation and conversionFactorToBase
            }),
        );
        expect(res.status).toBe(400);
    });
});

describe('PATCH /api/v1/units/:id — catalog.edit required', () => {
    it('rejects requests without catalog.edit', async () => {
        const res = await unitPATCH(
            req('http://localhost/api/v1/units/unit-1', 'PATCH', ['catalog.view'], {
                abbreviation: 'kg',
            }),
            ctx('unit-1'),
        );
        await expectForbidden(res, 'catalog.edit');
    });

    it('returns a non-200 status when body is empty — validation must reject', async () => {
        const res = await unitPATCH(
            req('http://localhost/api/v1/units/unit-1', 'PATCH', ['catalog.edit'], {}),
            ctx('unit-1'),
        );
        // Empty body fails Zod refine — must not be 200 (no silent success)
        expect(res.status).not.toBe(200);
    });
});
