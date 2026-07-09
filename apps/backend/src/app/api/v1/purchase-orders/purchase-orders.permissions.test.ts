/**
 * Permission enforcement + basic flow tests for the purchase-orders API.
 * Handlers are invoked directly with mocked Mongo repositories.
 */
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@packages/infrastructure-mongodb', () => {
  const noop = vi.fn().mockResolvedValue(undefined);
  const empty = vi.fn().mockResolvedValue([]);
  const nil = vi.fn().mockResolvedValue(null);

  const MongoPurchaseOrderRepository = vi.fn().mockImplementation(() => ({
    findById: nil,
    findByCompany: empty,
    save: noop,
  }));
  const MongoGoodsReceiptRepository = vi.fn().mockImplementation(() => ({
    findById: nil,
    findByPurchaseOrder: empty,
    save: noop,
  }));
  const MongoStockMovementEventRepository = vi.fn().mockImplementation(() => ({
    append: noop,
  }));
  const MongoStockItemRepository = vi.fn().mockImplementation(() => ({
    findByWarehouseAndProduct: nil,
    save: noop,
  }));

  return {
    MongoPurchaseOrderRepository,
    MongoGoodsReceiptRepository,
    MongoStockMovementEventRepository,
    MongoStockItemRepository,
  };
});

const { GET, POST } = await import('./route');
const { PATCH } = await import('./[id]/route');
const { POST: submitPOST } = await import('./[id]/submit/route');
const { POST: approvePOST } = await import('./[id]/approve/route');
const { POST: rejectPOST } = await import('./[id]/reject/route');
const { POST: cancelPOST } = await import('./[id]/cancel/route');
const { POST: receivePOST } = await import('./[id]/receive/route');
const { POST: invoicePOST } = await import('./[id]/invoice/route');
const { POST: ocrPOST } = await import('./[id]/ocr/route');

function req(
  url: string,
  method: 'GET' | 'POST' | 'PATCH',
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

const createBody = {
  companyId: 'company-1',
  branchId: 'branch-1',
  supplierId: 'supplier-1',
  expectedDeliveryDate: '2026-08-01T00:00:00.000Z',
  lines: [
    { productId: 'product-1', unitId: 'unit-1', orderedQuantity: 5, unitPricePiasters: 1000 },
  ],
};

async function expectForbidden(res: Response, code: string): Promise<void> {
  expect(res.status).toBe(403);
  const json = (await res.json()) as { error: { code: string; permissionCode?: string } };
  expect(json.error.code).toBe('FORBIDDEN');
  expect(json.error.permissionCode).toBe(code);
}

describe('GET /api/v1/purchase-orders — purchasing.view', () => {
  it('rejects without permission', async () => {
    const res = await GET(req('http://localhost/api/v1/purchase-orders', 'GET', []));
    await expectForbidden(res, 'purchasing.view');
  });
  it('allows with permission', async () => {
    const res = await GET(
      req('http://localhost/api/v1/purchase-orders?companyId=company-1', 'GET', ['purchasing.view']),
    );
    expect(res.status).toBe(200);
  });
});

describe('POST /api/v1/purchase-orders — purchasing.create', () => {
  it('rejects without permission', async () => {
    const res = await POST(req('http://localhost/api/v1/purchase-orders', 'POST', [], createBody));
    await expectForbidden(res, 'purchasing.create');
  });
  it('creates with permission', async () => {
    const res = await POST(
      req('http://localhost/api/v1/purchase-orders', 'POST', ['purchasing.create'], createBody),
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as { data: { status: string } };
    expect(json.data.status).toBe('draft');
  });
});

describe('PATCH /api/v1/purchase-orders/:id — purchasing.edit', () => {
  it('rejects without permission', async () => {
    const res = await PATCH(
      req('http://localhost/api/v1/purchase-orders/po-1', 'PATCH', [], { notes: 'x' }),
      ctx('po-1'),
    );
    await expectForbidden(res, 'purchasing.edit');
  });
});

describe('POST /api/v1/purchase-orders/:id/submit — purchasing.create', () => {
  it('rejects without permission', async () => {
    const res = await submitPOST(req('http://localhost/api/v1/purchase-orders/po-1', 'POST', []), ctx('po-1'));
    await expectForbidden(res, 'purchasing.create');
  });
});

describe('POST /api/v1/purchase-orders/:id/approve — purchasing.approve', () => {
  it('rejects without permission', async () => {
    const res = await approvePOST(req('http://localhost/api/v1/purchase-orders/po-1', 'POST', []), ctx('po-1'));
    await expectForbidden(res, 'purchasing.approve');
  });
});

describe('POST /api/v1/purchase-orders/:id/reject — purchasing.approve', () => {
  it('rejects without permission', async () => {
    const res = await rejectPOST(
      req('http://localhost/api/v1/purchase-orders/po-1', 'POST', [], { reason: 'a sufficiently long reason' }),
      ctx('po-1'),
    );
    await expectForbidden(res, 'purchasing.approve');
  });
});

describe('POST /api/v1/purchase-orders/:id/cancel — purchasing.edit', () => {
  it('rejects without permission', async () => {
    const res = await cancelPOST(
      req('http://localhost/api/v1/purchase-orders/po-1', 'POST', [], { reason: 'dup' }),
      ctx('po-1'),
    );
    await expectForbidden(res, 'purchasing.edit');
  });
});

describe('POST /api/v1/purchase-orders/:id/receive — purchasing.receive', () => {
  it('rejects without permission', async () => {
    const res = await receivePOST(
      req('http://localhost/api/v1/purchase-orders/po-1', 'POST', [], {
        lines: [{ lineId: 'l1', warehouseId: 'w1', receivedQuantity: 5 }],
      }),
      ctx('po-1'),
    );
    await expectForbidden(res, 'purchasing.receive');
  });
});

describe('POST /api/v1/purchase-orders/:id/invoice — purchasing.invoice.record', () => {
  it('rejects without permission', async () => {
    const res = await invoicePOST(
      req('http://localhost/api/v1/purchase-orders/po-1', 'POST', [], {
        supplierId: 's1',
        invoiceNumber: 'INV-1',
        invoiceDate: '2026-08-01',
        totalAmountPiasters: 5000,
        taxAmountPiasters: 500,
      }),
      ctx('po-1'),
    );
    await expectForbidden(res, 'purchasing.invoice.record');
  });
});

describe('POST /api/v1/purchase-orders/:id/ocr — purchasing.create', () => {
  it('rejects without permission', async () => {
    const res = await ocrPOST(
      req('http://localhost/api/v1/purchase-orders/po-1', 'POST', [], { fileReference: 'img.png' }),
      ctx('po-1'),
    );
    await expectForbidden(res, 'purchasing.create');
  });
});
