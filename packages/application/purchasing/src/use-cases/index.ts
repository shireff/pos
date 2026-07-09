import {
  PurchaseOrder,
  GoodsReceipt,
  SupplierInvoice,
  PurchaseOrderLineProps,
  GoodsReceiptLineProps,
  GoodsReceiptDiscrepancyProps,
  DiscrepancyType,
  OcrStubService,
  OcrExtractedData,
} from '@packages/domain-purchasing';
import { StockMovementEvent, StockItem } from '@packages/domain-inventory';
import { Identifier } from '@packages/shared-kernel';
import {
  PurchaseOrderRepository,
  GoodsReceiptRepository,
  SupplierInvoiceRepository,
  StockMovementEventRepository,
  StockItemRepository,
} from '../ports';

// ─── Create Purchase Order ────────────────────────────────────────────────────

export interface CreatePurchaseOrderLineInput {
  productId: string;
  variantId?: string | null;
  unitId: string;
  orderedQuantity: number;
  unitPricePiasters: number;
}

export interface CreatePurchaseOrderInput {
  companyId: string;
  branchId: string;
  supplierId: string;
  expectedDeliveryDate: string;
  requestedByUserId: string;
  notes?: string | null;
  lines: CreatePurchaseOrderLineInput[];
}

export class CreatePurchaseOrderCommand {
  constructor(private readonly poRepo: PurchaseOrderRepository) {}

  async execute(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    if (input.lines.length === 0) {
      throw new Error('Purchase order must have at least one line');
    }

    const po = PurchaseOrder.create({
      companyId: input.companyId,
      branchId: input.branchId,
      supplierId: input.supplierId,
      expectedDeliveryDate: input.expectedDeliveryDate,
      requestedByUserId: input.requestedByUserId,
    });

    for (const line of input.lines) {
      po.addLine(
        line.productId,
        line.variantId ?? null,
        line.unitId,
        line.orderedQuantity,
        line.unitPricePiasters,
      );
    }

    await this.poRepo.save(po);
    return po;
  }
}

// ─── Update Purchase Order ────────────────────────────────────────────────────

export interface UpdatePurchaseOrderLineInput {
  id: string;
  orderedQuantity: number;
  unitPricePiasters: number;
}

export interface UpdatePurchaseOrderInput {
  poId: string;
  companyId: string;
  expectedDeliveryDate?: string;
  notes?: string | null;
  lines?: UpdatePurchaseOrderLineInput[];
}

export class UpdatePurchaseOrderCommand {
  constructor(private readonly poRepo: PurchaseOrderRepository) {}

  async execute(input: UpdatePurchaseOrderInput): Promise<PurchaseOrder> {
    const po = await this.poRepo.findById(input.poId, input.companyId);
    if (!po) throw new Error('Purchase order not found');
    if (po.status !== 'draft') {
      throw new Error('Purchase order can only be updated in draft status');
    }

    if (input.expectedDeliveryDate !== undefined || input.notes !== undefined) {
      po.updateHeader({
        expectedDeliveryDate: input.expectedDeliveryDate,
        notes: input.notes,
      });
    }

    if (input.lines) {
      for (const line of input.lines) {
        po.updateLine(line.id, line.orderedQuantity, line.unitPricePiasters);
      }
    }

    await this.poRepo.save(po);
    return po;
  }
}

// ─── Submit For Approval ──────────────────────────────────────────────────────

export interface SubmitForApprovalInput {
  poId: string;
  companyId: string;
  autoApproveThresholdPiasters: number;
}

export interface SubmitForApprovalResult {
  purchaseOrder: PurchaseOrder;
  autoApproved: boolean;
  requiresApproval: boolean;
}

export class SubmitForApprovalCommand {
  constructor(private readonly poRepo: PurchaseOrderRepository) {}

  async execute(input: SubmitForApprovalInput): Promise<SubmitForApprovalResult> {
    const po = await this.poRepo.findById(input.poId, input.companyId);
    if (!po) throw new Error('Purchase order not found');

    po.submit(input.autoApproveThresholdPiasters);
    await this.poRepo.save(po);

    return {
      purchaseOrder: po,
      autoApproved: po.status === 'approved',
      requiresApproval: po.status === 'pending_approval',
    };
  }
}

// ─── Approve Purchase Order ───────────────────────────────────────────────────

export interface ApprovePurchaseOrderInput {
  poId: string;
  companyId: string;
  approvedByUserId: string;
}

export class ApprovePurchaseOrderCommand {
  constructor(private readonly poRepo: PurchaseOrderRepository) {}

  async execute(input: ApprovePurchaseOrderInput): Promise<PurchaseOrder> {
    const po = await this.poRepo.findById(input.poId, input.companyId);
    if (!po) throw new Error('Purchase order not found');
    po.approve(input.approvedByUserId);
    await this.poRepo.save(po);
    return po;
  }
}

// ─── Reject Purchase Order ───────────────────────────────────────────────────

export interface RejectPurchaseOrderInput {
  poId: string;
  companyId: string;
  reason: string;
}

export class RejectPurchaseOrderCommand {
  constructor(private readonly poRepo: PurchaseOrderRepository) {}

  async execute(input: RejectPurchaseOrderInput): Promise<PurchaseOrder> {
    const po = await this.poRepo.findById(input.poId, input.companyId);
    if (!po) throw new Error('Purchase order not found');
    po.reject(input.reason);
    await this.poRepo.save(po);
    return po;
  }
}

// ─── Cancel Purchase Order ────────────────────────────────────────────────────

export interface CancelPurchaseOrderInput {
  poId: string;
  companyId: string;
  reason: string;
}

export class CancelPurchaseOrderCommand {
  constructor(private readonly poRepo: PurchaseOrderRepository) {}

  async execute(input: CancelPurchaseOrderInput): Promise<PurchaseOrder> {
    const po = await this.poRepo.findById(input.poId, input.companyId);
    if (!po) throw new Error('Purchase order not found');
    po.cancel(input.reason);
    await this.poRepo.save(po);
    return po;
  }
}

// ─── Receive Goods ────────────────────────────────────────────────────────────

export interface ReceiveGoodsLineInput {
  lineId: string;
  warehouseId: string;
  receivedQuantity: number;
  discrepancyType?: DiscrepancyType | null;
  discrepancyNotes?: string | null;
}

export interface ReceiveGoodsInput {
  poId: string;
  companyId: string;
  receivedByUserId: string;
  notes?: string | null;
  lines: ReceiveGoodsLineInput[];
}

export interface ReceiveGoodsResult {
  purchaseOrder: PurchaseOrder;
  goodsReceipt: GoodsReceipt;
}

export class ReceiveGoodsCommand {
  constructor(
    private readonly poRepo: PurchaseOrderRepository,
    private readonly receiptRepo: GoodsReceiptRepository,
    private readonly movementRepo: StockMovementEventRepository,
    private readonly stockItemRepo: StockItemRepository,
  ) {}

  async execute(input: ReceiveGoodsInput): Promise<ReceiveGoodsResult> {
    const po = await this.poRepo.findById(input.poId, input.companyId);
    if (!po) throw new Error('Purchase order not found');

    const goodsReceipt = GoodsReceipt.create({
      companyId: input.companyId,
      purchaseOrderId: po.id,
      receivedByUserId: input.receivedByUserId,
      notes: input.notes,
    });

    const receiptUpdates: Array<{ lineId: string; quantityReceived: number }> = [];

    for (const lineInput of input.lines) {
      const poLine = po.lines.find((l) => l.id === lineInput.lineId);
      if (!poLine) throw new Error(`Unknown purchase order line: ${lineInput.lineId}`);

      const receivedQty = lineInput.receivedQuantity;
      receiptUpdates.push({ lineId: lineInput.lineId, quantityReceived: receivedQty });

      const providedType: DiscrepancyType | null = lineInput.discrepancyType ?? null;
      const discrepancyNotes = lineInput.discrepancyNotes ?? null;
      const effectiveType: DiscrepancyType | null =
        receivedQty < poLine.orderedQuantity ? (providedType ?? 'quantity_shortage') : providedType;

      const receiptLine: GoodsReceiptLineProps = {
        id: Identifier.generate(),
        goodsReceiptId: goodsReceipt.id,
        purchaseOrderLineId: poLine.id,
        productId: poLine.productId,
        variantId: poLine.variantId,
        warehouseId: lineInput.warehouseId,
        receivedQuantity: receivedQty,
        discrepancyType: effectiveType,
        discrepancyNotes,
      };
      goodsReceipt.addLine(receiptLine);

      // Auto-capture discrepancy when received < ordered, or when an explicit
      // discrepancy type was supplied (quality_rejection / wrong_item).
      if (effectiveType) {
        const disc: GoodsReceiptDiscrepancyProps = {
          id: Identifier.generate(),
          goodsReceiptId: goodsReceipt.id,
          purchaseOrderLineId: poLine.id,
          type: effectiveType,
          expectedQuantity: poLine.orderedQuantity,
          actualQuantity: receivedQty,
          notes: discrepancyNotes ?? '',
        };
        goodsReceipt.addDiscrepancy(disc);
      }

      // Emit inward stock movement (PURCHASE_RECEIPT) for Phase 05 inventory.
      if (receivedQty > 0) {
        const event = StockMovementEvent.record({
          companyId: input.companyId,
          warehouseId: lineInput.warehouseId,
          productId: poLine.productId,
          variantId: poLine.variantId,
          batchId: null,
          eventType: 'PURCHASE_RECEIPT',
          quantity: receivedQty,
          referenceType: 'PurchaseOrder',
          referenceId: po.id,
          occurredAt: new Date().toISOString(),
        });
        await this.movementRepo.append(event);

        let stockItem = await this.stockItemRepo.findByWarehouseAndProduct(
          lineInput.warehouseId,
          poLine.productId,
          poLine.variantId,
          null,
        );
        if (!stockItem) {
          stockItem = StockItem.create({
            companyId: input.companyId,
            productId: poLine.productId,
            variantId: poLine.variantId,
            warehouseId: lineInput.warehouseId,
            batchId: null,
            reorderPoint: 0,
            reorderQuantity: 0,
          });
        }
        stockItem.applyEvent(event);
        await this.stockItemRepo.save(stockItem);
      }
    }

    po.receive(receiptUpdates);
    await this.poRepo.save(po);
    await this.receiptRepo.save(goodsReceipt);

    return { purchaseOrder: po, goodsReceipt };
  }
}

// ─── Record Discrepancy ───────────────────────────────────────────────────────

export interface RecordDiscrepancyInput {
  goodsReceiptId: string;
  companyId: string;
  purchaseOrderLineId: string;
  type: DiscrepancyType;
  expectedQuantity: number;
  actualQuantity: number;
  notes: string;
}

export class RecordDiscrepancyCommand {
  constructor(private readonly receiptRepo: GoodsReceiptRepository) {}

  async execute(input: RecordDiscrepancyInput): Promise<GoodsReceipt> {
    const gr = await this.receiptRepo.findById(input.goodsReceiptId);
    if (!gr) throw new Error('Goods receipt not found');

    const discrepancy: GoodsReceiptDiscrepancyProps = {
      id: Identifier.generate(),
      goodsReceiptId: gr.id,
      purchaseOrderLineId: input.purchaseOrderLineId,
      type: input.type,
      expectedQuantity: input.expectedQuantity,
      actualQuantity: input.actualQuantity,
      notes: input.notes,
    };
    gr.addDiscrepancy(discrepancy);
    await this.receiptRepo.save(gr);
    return gr;
  }
}

// ─── Record Supplier Invoice ──────────────────────────────────────────────────

export interface RecordSupplierInvoiceInput {
  poId: string;
  companyId: string;
  supplierId: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmountPiasters: number;
  taxAmountPiasters: number;
  attachmentUrl?: string | null;
}

export class RecordSupplierInvoiceCommand {
  constructor(private readonly invoiceRepo: SupplierInvoiceRepository) {}

  async execute(input: RecordSupplierInvoiceInput): Promise<SupplierInvoice> {
    const invoice = SupplierInvoice.create({
      companyId: input.companyId,
      purchaseOrderId: input.poId,
      supplierId: input.supplierId,
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate,
      totalAmountPiasters: input.totalAmountPiasters,
      taxAmountPiasters: input.taxAmountPiasters,
      attachmentUrl: input.attachmentUrl ?? null,
    });
    await this.invoiceRepo.save(invoice);
    return invoice;
  }
}

// ─── Upload Invoice For OCR (stub) ────────────────────────────────────────────

export interface UploadInvoiceForOcrInput {
  fileReference: string;
}

export class UploadInvoiceForOcrCommand {
  async execute(input: UploadInvoiceForOcrInput): Promise<OcrExtractedData> {
    return OcrStubService.extract(input.fileReference);
  }
}

export type {
  PurchaseOrderLineProps,
  GoodsReceiptLineProps,
  GoodsReceiptDiscrepancyProps,
};
