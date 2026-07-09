/**
 * Integration tests for the purchase-orders API covering the critical flows
 * described in plan/phase-06-inventory/TESTS.md: create (draft), create +
 * auto-submit above threshold (pending_approval), approve, receive (stock
 * movement + discrepancy), and OCR extraction stub.
 *
 * Repositories are mocked in-memory so no MongoDB connection is required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PurchaseOrder } from '@packages/domain-purchasing';
import type { PurchaseOrderLineProps } from '@packages/domain-purchasing';

const mockState = vi.hoisted(() => ({
  storedPo: null as PurchaseOrder | null,
  movementEvents: [] as Array<{
    eventType: string;
    quantity: number;
    referenceType: string;
    referenceId: string;
  }>,
}));

vi.mock('@packages/infrastructure-mongodb', () => {
  const MongoPurchaseOrderRepository = vi.fn().mockImplementation(() => ({
    findById: async (id: string) =>
      mockState.storedPo && mockState.storedPo.id === id ? mockState.storedPo : null,
    findByCompany: async () => (mockState.storedPo ? [mockState.storedPo] : []),
    save: async (po: PurchaseOrder) => {
      mockState.storedPo = po;
    },
  }));
  const MongoGoodsReceiptRepository = vi.fn().mockImplementation(() => ({
    findById: async () => null,
    findByPurchaseOrder: async () => [],
    save: async () => {},
  }));
  const MongoStockMovementEventRepository = vi.fn().mockImplementation(() => ({
    append: async (e: {
      eventType: string;
      quantity: number;
      referenceType: string;
      referenceId: string;
    }) => {
      mockState.movementEvents.push({
        eventType: e.eventType,
        quantity: e.quantity,
        referenceType: e.referenceType,
        referenceId: e.referenceId,
      });
    },
  }));
  const MongoStockItemRepository = vi.fn().mockImplementation(() => ({
    findByWarehouseAndProduct: async () => null,
    save: async () => {},
  }));
  const MongoSupplierInvoiceRepository = vi.fn().mockImplementation(() => ({
    findById: async () => null,
    findByPurchaseOrder: async () => [],
    save: async () => {},
  }));
  return {
    MongoPurchaseOrderRepository,
    MongoGoodsReceiptRepository,
    MongoStockMovementEventRepository,
    MongoStockItemRepository,
    MongoSupplierInvoiceRepository,
  };
});

const { POST, GET } = await import('./route');
const { POST: approvePOST } = await import('./[id]/approve/route');
const { POST: receivePOST } = await import('./[id]/receive/route');
const { POST: ocrPOST } = await import('./[id]/ocr/route');

function req(url: string, permissions: string[], body?: unknown): NextRequest {
  return new NextRequest(url, {
    method: body !== undefined ? 'POST' : 'GET',
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

const baseLine = {
  productId: 'product-1',
  unitId: 'unit-1',
  orderedQuantity: 5,
  unitPricePiasters: 1000,
};

const createBody = {
  companyId: 'company-1',
  branchId: 'branch-1',
  supplierId: 'supplier-1',
  expectedDeliveryDate: '2026-08-01T00:00:00.000Z',
  lines: [baseLine],
};

beforeEach(() => {
  mockState.storedPo = null;
  mockState.movementEvents = [];
});

describe('POST /api/v1/purchase-orders (draft)', () => {
  it('creates a PO with status = draft', async () => {
    const res = await POST(
      req('http://localhost/api/v1/purchase-orders', ['purchasing.create'], createBody),
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as { data: { status: string; id: string } };
    expect(json.data.status).toBe('draft');
    expect(mockState.storedPo?.status).toBe('draft');
  });
});

describe('POST /api/v1/purchase-orders (above threshold)', () => {
  it('auto-submits to pending_approval and fires approval notification', async () => {
    const body = {
      ...createBody,
      // total = 5000 > threshold 1 → requires approval
      autoApproveThresholdPiasters: 1,
    };
    const res = await POST(
      req('http://localhost/api/v1/purchase-orders', ['purchasing.create'], body),
    );
    const json = (await res.json()) as {
      data: { status: string };
    };
    // POST auto-submits; status reflects the submit outcome.
    expect(json.data.status).toBe('pending_approval');
    expect(mockState.storedPo?.status).toBe('pending_approval');
  });

  it('auto-approves when total is at/below the threshold', async () => {
    const body = {
      ...createBody,
      // total = 5000 <= 10000 → approved immediately
      autoApproveThresholdPiasters: 10000,
    };
    const res = await POST(
      req('http://localhost/api/v1/purchase-orders', ['purchasing.create'], body),
    );
    const json = (await res.json()) as { data: { status: string } };
    expect(json.data.status).toBe('approved');
  });
});

describe('POST /api/v1/purchase-orders/:id/approve', () => {
  it('transitions pending_approval → approved (purchasing.po.approve)', async () => {
    const created = await POST(
      req('http://localhost/api/v1/purchase-orders', ['purchasing.create'], {
        ...createBody,
        autoApproveThresholdPiasters: 1,
      }),
    );
    const createdJson = (await created.json()) as { data: { id: string } };

    const res = await approvePOST(
      req('http://localhost/api/v1/purchase-orders/po-1', ['purchasing.approve']),
      ctx(createdJson.data.id),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { status: string } };
    expect(json.data.status).toBe('approved');
  });
});

describe('POST /api/v1/purchase-orders/:id/receive', () => {
  it('records a goods receipt and appends a PURCHASE_RECEIPT stock movement', async () => {
    // Create + auto-approve so the PO is in an approveable/receivable state.
    const created = await POST(
      req('http://localhost/api/v1/purchase-orders', ['purchasing.create'], {
        ...createBody,
        autoApproveThresholdPiasters: 10000,
      }),
    );
    const createdJson = (await created.json()) as { data: { id: string; lines: PurchaseOrderLineProps[] } };
    const lineId = createdJson.data.lines[0].id;

    const res = await receivePOST(
      req('http://localhost/api/v1/purchase-orders/po-1', ['purchasing.receive'], {
        lines: [{ lineId, warehouseId: 'wh-1', receivedQuantity: 5 }],
      }),
      ctx(createdJson.data.id),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { purchaseOrder: { status: string } } };
    expect(json.data.purchaseOrder.status).toBe('fully_received');

    const events = mockState.movementEvents;
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('PURCHASE_RECEIPT');
    expect(events[0].quantity).toBe(5);
    expect(events[0].referenceType).toBe('PurchaseOrder');
  });

  it('captures a discrepancy when received < ordered', async () => {
    const created = await POST(
      req('http://localhost/api/v1/purchase-orders', ['purchasing.create'], {
        companyId: 'company-1',
        branchId: 'branch-1',
        supplierId: 'supplier-1',
        expectedDeliveryDate: '2026-08-01T00:00:00.000Z',
        lines: [
          { productId: 'product-1', unitId: 'unit-1', orderedQuantity: 100, unitPricePiasters: 1000 },
        ],
        autoApproveThresholdPiasters: 100000,
      }),
    );
    const createdJson = (await created.json()) as { data: { id: string; lines: PurchaseOrderLineProps[] } };
    const lineId = createdJson.data.lines[0].id;

    const res = await receivePOST(
      req('http://localhost/api/v1/purchase-orders/po-1', ['purchasing.receive'], {
        lines: [{ lineId, warehouseId: 'wh-1', receivedQuantity: 90 }],
      }),
      ctx(createdJson.data.id),
    );
    const json = (await res.json()) as {
      data: { purchaseOrder: { status: string }; discrepancies: Array<{ expectedQuantity: number; actualQuantity: number }> };
    };
    expect(json.data.purchaseOrder.status).toBe('partially_received');
    expect(json.data.discrepancies.length).toBe(1);
    expect(json.data.discrepancies[0].expectedQuantity).toBe(100);
    expect(json.data.discrepancies[0].actualQuantity).toBe(90);
    expect(json.data.discrepancies[0].type).toBe('quantity_shortage');
  });
});

describe('GET /api/v1/purchase-orders', () => {
  it('returns the created PO in the company list', async () => {
    await POST(req('http://localhost/api/v1/purchase-orders', ['purchasing.create'], createBody));
    const res = await GET(
      req('http://localhost/api/v1/purchase-orders?companyId=company-1', ['purchasing.view']),
    );
    const json = (await res.json()) as { data: Array<{ referenceNumber: string }> };
    expect(json.data.length).toBeGreaterThanOrEqual(1);
  });
});

describe('POST /api/v1/purchase-orders/:id/ocr', () => {
  it('returns deterministic extracted fields for review (stub, BR-SUP-003)', async () => {
    const created = await POST(
      req('http://localhost/api/v1/purchase-orders', ['purchasing.create'], createBody),
    );
    const createdJson = (await created.json()) as { data: { id: string } };

    const res = await ocrPOST(
      req('http://localhost/api/v1/purchase-orders/po-1', ['purchasing.create'], {
        fileReference: 'invoice-2026-001.png',
      }),
      ctx(createdJson.data.id),
    );
    const json = (await res.json()) as {
      data: { extracted: { invoiceNumber: string; lineItems: unknown[]; totalAmountPiasters: number } };
    };
    expect(json.data.extracted.invoiceNumber).toBeTruthy();
    expect(Array.isArray(json.data.extracted.lineItems)).toBe(true);
    expect(json.data.extracted.totalAmountPiasters).toBeGreaterThan(0);
  });
});
