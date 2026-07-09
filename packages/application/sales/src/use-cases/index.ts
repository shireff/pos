import {
  Order,
  Return,
  ReturnLine,
  ShiftSession,
  OrderCompleted,
  ReturnRequested,
  CashDrawerOpened,
  TenderType,
  RefundMethod,
} from '@packages/domain-sales';
import {
  TenderValidator,
  IdempotencyService,
  ExpiredBatchGuard,
  ReturnApprovalPolicy,
  VoidPolicy,
  LoyaltyReversalService,
} from '@packages/domain-sales';
import { StockMovementEvent, StockItem } from '@packages/domain-inventory';
import {
  BundleDeductionService,
  BatchExpiryGuardService,
  NegativeStockGuardService,
} from '@packages/domain-inventory';
import { Identifier } from '@packages/shared-kernel';
import {
  OrderRepository,
  ReturnRepository,
  ShiftSessionRepository,
  LoyaltyPort,
  BundleResolutionPort,
  StockMovementEventRepository,
  StockItemRepository,
  BatchRepository,
} from '../ports';

// ─── Shared helpers ──────────────────────────────────────────────────────────

const SALE_EVENT = 'SALE' as const;
const RETURN_EVENT = 'RETURN' as const;
const BUNDLE_DEDUCTION_EVENT = 'BUNDLE_DEDUCTION' as const;

interface StockOpDeps {
  stockMovementRepo: StockMovementEventRepository;
  stockItemRepo: StockItemRepository;
  companyId: string;
  warehouseId: string;
}

async function deductStock(
  deps: StockOpDeps,
  productId: string,
  variantId: string | null,
  batchId: string | null,
  quantity: number,
  referenceType: string,
  referenceId: string,
): Promise<void> {
  if (quantity <= 0) return;
  const event = StockMovementEvent.record({
    companyId: deps.companyId,
    warehouseId: deps.warehouseId,
    productId,
    variantId,
    batchId,
    eventType: SALE_EVENT,
    quantity: -quantity,
    referenceType,
    referenceId,
    occurredAt: new Date().toISOString(),
  });
  await deps.stockMovementRepo.append(event);

  let stockItem = await deps.stockItemRepo.findByWarehouseAndProduct(
    deps.warehouseId,
    productId,
    variantId,
    batchId,
  );
  if (!stockItem) {
    stockItem = StockItem.create({
      companyId: deps.companyId,
      productId,
      variantId,
      warehouseId: deps.warehouseId,
      batchId,
      reorderPoint: 0,
      reorderQuantity: 0,
    });
  }
  NegativeStockGuardService.verify(stockItem.quantityOnHand, quantity, productId, deps.warehouseId);
  stockItem.applyEvent(event);
  await deps.stockItemRepo.save(stockItem);
}

async function restoreStock(
  deps: StockOpDeps,
  productId: string,
  variantId: string | null,
  batchId: string | null,
  quantity: number,
  referenceType: string,
  referenceId: string,
): Promise<void> {
  if (quantity <= 0) return;
  const event = StockMovementEvent.record({
    companyId: deps.companyId,
    warehouseId: deps.warehouseId,
    productId,
    variantId,
    batchId,
    eventType: RETURN_EVENT,
    quantity: quantity,
    referenceType,
    referenceId,
    occurredAt: new Date().toISOString(),
  });
  await deps.stockMovementRepo.append(event);

  let stockItem = await deps.stockItemRepo.findByWarehouseAndProduct(
    deps.warehouseId,
    productId,
    variantId,
    batchId,
  );
  if (!stockItem) {
    stockItem = StockItem.create({
      companyId: deps.companyId,
      productId,
      variantId,
      warehouseId: deps.warehouseId,
      batchId,
      reorderPoint: 0,
      reorderQuantity: 0,
    });
  }
  stockItem.applyEvent(event);
  await deps.stockItemRepo.save(stockItem);
}

function computeLoyaltyPoints(refundAmountPiasters: number): number {
  // 1 point per whole EGP (100 piasters) refunded.
  return Math.floor(refundAmountPiasters / 100);
}

// ─── CreateSaleCommand ───────────────────────────────────────────────────────

export interface CreateSaleLineInput {
  productVariantId: string;
  productId: string;
  batchId?: string | null;
  isBundle?: boolean;
  quantity: number;
  unitPricePiasters: number;
  discountAmountPiasters?: number;
  taxAmountPiasters?: number;
  costSnapshotPiasters?: number;
}

export interface CreateSalePaymentInput {
  tenderType: TenderType;
  amountPiasters: number;
  providerReference?: string | null;
}

export interface CreateSaleInput {
  companyId: string;
  branchId: string;
  cashierId: string;
  warehouseId: string;
  clientTxnId: string;
  customerId?: string | null;
  shiftSessionId?: string | null;
  lines: CreateSaleLineInput[];
  payments: CreateSalePaymentInput[];
  discountRuleIds?: string[];
  couponCode?: string | null;
}

export interface CreateSaleResult {
  order: Order;
  events: unknown[];
}

export class CreateSaleCommand {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly stockMovementRepo: StockMovementEventRepository,
    private readonly stockItemRepo: StockItemRepository,
    private readonly batchRepo: BatchRepository,
    private readonly bundlePort: BundleResolutionPort | null,
    private readonly loyaltyPort: LoyaltyPort | null,
  ) {}

  async execute(input: CreateSaleInput): Promise<CreateSaleResult> {
    if (input.lines.length === 0) throw new Error('Sale must contain at least one line');
    if (input.payments.length === 0) throw new Error('Sale must contain at least one payment');

    // 1. Idempotency check (BR-SAL-001)
    const existing = await this.orderRepo.findByClientTxnId(input.clientTxnId, input.companyId);
    IdempotencyService.assertUnique(existing, input.clientTxnId);

    // 2. Totals
    const subtotal = input.lines.reduce((s, l) => s + l.unitPricePiasters * l.quantity, 0);
    const discountTotal = input.lines.reduce((s, l) => s + (l.discountAmountPiasters ?? 0), 0);
    const taxTotal = input.lines.reduce((s, l) => s + (l.taxAmountPiasters ?? 0), 0);
    const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal);

    // 3. Split-tender validation (BR-SAL-003)
    const tenderResult = TenderValidator.validate(input.payments, grandTotal);
    if (tenderResult.isFail()) throw new Error(tenderResult.getError());

    // 4. Expired batch guard (BR-INV-008)
    for (const line of input.lines) {
      if (line.batchId) {
        const batch = await this.batchRepo.findById(line.batchId);
        if (batch) {
          BatchExpiryGuardService.verify(batch, line.productId);
        } else {
          ExpiredBatchGuard.assertNotExpired(null);
        }
      }
    }

    const deps: StockOpDeps = {
      stockMovementRepo: this.stockMovementRepo,
      stockItemRepo: this.stockItemRepo,
      companyId: input.companyId,
      warehouseId: input.warehouseId,
    };

    const orderLines = input.lines.map((l) => ({
      productVariantId: l.productVariantId,
      batchId: l.batchId ?? null,
      quantity: l.quantity,
      unitPricePiasters: l.unitPricePiasters,
      discountAmountPiasters: l.discountAmountPiasters ?? 0,
      taxAmountPiasters: l.taxAmountPiasters ?? 0,
      costSnapshotPiasters: l.costSnapshotPiasters ?? 0,
    }));

    // 5. Inventory outward movement (bundle-aware, atomic per line)
    for (const line of input.lines) {
      if (line.isBundle && this.bundlePort) {
        const components = await this.bundlePort.resolveComponents(line.productVariantId);
        const events = BundleDeductionService.toEvents(
          line.quantity,
          input.warehouseId,
          components,
          'Order',
          input.clientTxnId,
        );
        for (const ev of events) {
          await deductStock(
            deps,
            ev.productId,
            ev.variantId,
            null,
            Math.abs(ev.quantity),
            'Order',
            input.clientTxnId,
          );
        }
      } else {
        await deductStock(
          deps,
          line.productId,
          line.productVariantId,
          line.batchId ?? null,
          line.quantity,
          'Order',
          input.clientTxnId,
        );
      }
    }

    // 6. Build + persist order (atomically with lines + payments)
    const order = Order.complete({
      companyId: input.companyId,
      branchId: input.branchId,
      cashierId: input.cashierId,
      customerId: input.customerId ?? null,
      clientTxnId: input.clientTxnId,
      shiftSessionId: input.shiftSessionId ?? null,
      subtotalPiasters: subtotal,
      discountTotalPiasters: discountTotal,
      taxTotalPiasters: taxTotal,
      grandTotalPiasters: grandTotal,
      lines: orderLines,
      payments: input.payments.map((p) => ({
        tenderType: p.tenderType as TenderType,
        amountPiasters: p.amountPiasters,
        providerReference: p.providerReference ?? null,
      })),
    });
    await this.orderRepo.save(order);

    const events: unknown[] = [
      new OrderCompleted({
        orderId: order.id,
        companyId: order.companyId,
        branchId: order.branchId,
        cashierId: order.cashierId,
        customerId: order.customerId,
        grandTotalPiasters: order.grandTotalPiasters,
        clientTxnId: order.clientTxnId,
      }),
    ];

    // 7. Loyalty accrual (Phase 08) — fire-and-forget, non-blocking
    if (order.customerId && this.loyaltyPort) {
      try {
        await this.loyaltyPort.accrueOnSale({
          orderId: order.id,
          customerId: order.customerId,
          grandTotalPiasters: order.grandTotalPiasters,
        });
      } catch {
        // loyalty failure must not block sale completion
      }
    }

    return { order, events };
  }
}

// ─── ProcessReturnCommand ────────────────────────────────────────────────────

export interface ProcessReturnLineInput {
  orderLineId: string;
  productVariantId: string;
  productId: string;
  batchId?: string | null;
  returnQuantity: number;
  refundAmountPiasters: number;
}

export interface ProcessReturnInput {
  companyId: string;
  orderId: string;
  returnedByUserId: string;
  reason: string;
  warehouseId: string;
  lines: ProcessReturnLineInput[];
  refundMethod?: RefundMethod;
  refundApprovalThresholdPiasters: number;
}

export interface ProcessReturnResult {
  returnEntity: Return;
  autoApproved: boolean;
}

export class ProcessReturnCommand {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly returnRepo: ReturnRepository,
    private readonly stockMovementRepo: StockMovementEventRepository,
    private readonly stockItemRepo: StockItemRepository,
    private readonly loyaltyPort: LoyaltyPort | null,
  ) {}

  async execute(input: ProcessReturnInput): Promise<ProcessReturnResult> {
    const order = await this.orderRepo.findById(input.orderId, input.companyId);
    if (!order) throw new Error(`Order ${input.orderId} not found`);

    const refundTotal = input.lines.reduce((s, l) => s + l.refundAmountPiasters, 0);
    const decision = ReturnApprovalPolicy.decide(refundTotal, input.refundApprovalThresholdPiasters);
    const autoApproved = decision === 'auto_approve';

    const returnEntity = Return.create({
      originalOrderId: order.id,
      returnedByUserId: input.returnedByUserId,
      reason: input.reason,
      refundMethod: input.refundMethod ?? 'store_credit',
      status: autoApproved ? 'approved' : 'pending_approval',
      refundAmountPiasters: refundTotal,
    });
    for (const line of input.lines) {
      returnEntity.addLine(
        ReturnLine.create({
          returnId: returnEntity.id,
          originalOrderLineId: line.orderLineId,
          productVariantId: line.productVariantId,
          batchId: line.batchId ?? null,
          quantity: line.returnQuantity,
          refundAmountPiasters: line.refundAmountPiasters,
        }),
      );
    }
    await this.returnRepo.save(returnEntity);

    const events: unknown[] = [
      new ReturnRequested({
        returnId: returnEntity.id,
        originalOrderId: order.id,
        refundAmountPiasters: refundTotal,
        status: returnEntity.status,
      }),
    ];

    if (autoApproved) {
      await this.applyApprovedReturn(order, returnEntity, input);
    }

    order.addReturn(returnEntity);
    await this.orderRepo.save(order);

    return { returnEntity, autoApproved };
  }

  private async applyApprovedReturn(
    order: Order,
    returnEntity: Return,
    input: ProcessReturnInput,
  ): Promise<void> {
    const deps: StockOpDeps = {
      stockMovementRepo: this.stockMovementRepo,
      stockItemRepo: this.stockItemRepo,
      companyId: input.companyId,
      warehouseId: input.warehouseId,
    };
    for (const line of returnEntity.lines) {
      // find original product mapping from order lines
      const orig = order.lines.find((l) => l.id === line.originalOrderLineId);
      const productId = orig?.productVariantId ?? line.productVariantId;
      await restoreStock(
        deps,
        productId,
        line.productVariantId,
        line.batchId,
        line.quantity,
        'Return',
        returnEntity.id,
      );
    }

    // Loyalty reversal (BR-SAL-007)
    if (order.customerId && this.loyaltyPort) {
      const points = computeLoyaltyPoints(returnEntity.refundAmountPiasters);
      const cmd = LoyaltyReversalService.buildReversalCommand({
        returnId: returnEntity.id,
        customerId: order.customerId,
        originalOrderId: order.id,
        pointsToReverse: points,
      });
      try {
        await this.loyaltyPort.reverseOnReturn({
          returnId: cmd.returnId,
          customerId: cmd.customerId ?? order.customerId,
          originalOrderId: cmd.originalOrderId,
          pointsToReverse: cmd.pointsToReverse,
        });
      } catch {
        // reversal failure is logged upstream but must not block return approval
      }
    }
  }
}

// ─── ApproveReturnCommand ─────────────────────────────────────────────────────

export interface ApproveReturnInput {
  companyId: string;
  orderId: string;
  returnId: string;
  approvedByUserId: string;
  warehouseId: string;
}

export class ApproveReturnCommand {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly returnRepo: ReturnRepository,
    private readonly stockMovementRepo: StockMovementEventRepository,
    private readonly stockItemRepo: StockItemRepository,
    private readonly loyaltyPort: LoyaltyPort | null,
  ) {}

  async execute(input: ApproveReturnInput): Promise<Return> {
    const returnEntity = await this.returnRepo.findById(input.returnId);
    if (!returnEntity) throw new Error(`Return ${input.returnId} not found`);
    if (returnEntity.status !== 'pending_approval')
      throw new Error('Return is not pending approval');

    const order = await this.orderRepo.findById(input.orderId, input.companyId);
    if (!order) throw new Error(`Order ${input.orderId} not found`);

    returnEntity.approve(input.approvedByUserId);

    const deps: StockOpDeps = {
      stockMovementRepo: this.stockMovementRepo,
      stockItemRepo: this.stockItemRepo,
      companyId: input.companyId,
      warehouseId: input.warehouseId,
    };
    for (const line of returnEntity.lines) {
      const orig = order.lines.find((l) => l.id === line.originalOrderLineId);
      const productId = orig?.productVariantId ?? line.productVariantId;
      await restoreStock(
        deps,
        productId,
        line.productVariantId,
        line.batchId,
        line.quantity,
        'Return',
        returnEntity.id,
      );
    }

    if (order.customerId && this.loyaltyPort) {
      const points = computeLoyaltyPoints(returnEntity.refundAmountPiasters);
      await this.loyaltyPort.reverseOnReturn({
        returnId: returnEntity.id,
        customerId: order.customerId,
        originalOrderId: order.id,
        pointsToReverse: points,
      });
    }

    await this.returnRepo.save(returnEntity);

    order.addReturn(returnEntity);
    await this.orderRepo.save(order);

    return returnEntity;
  }
}

// ─── RejectReturnCommand ─────────────────────────────────────────────────────

export interface RejectReturnInput {
  companyId: string;
  orderId: string;
  returnId: string;
  rejectedByUserId: string;
}

export class RejectReturnCommand {
  constructor(private readonly returnRepo: ReturnRepository) {}

  async execute(input: RejectReturnInput): Promise<Return> {
    const returnEntity = await this.returnRepo.findById(input.returnId);
    if (!returnEntity) throw new Error(`Return ${input.returnId} not found`);
    returnEntity.reject();
    await this.returnRepo.save(returnEntity);
    return returnEntity;
  }
}

// ─── VoidSaleCommand ──────────────────────────────────────────────────────────

export interface VoidSaleInput {
  companyId: string;
  orderId: string;
  voidedByUserId: string;
  reason: string;
  currentShiftSessionId: string | null;
  warehouseId: string;
}

export class VoidSaleCommand {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly stockMovementRepo: StockMovementEventRepository,
    private readonly stockItemRepo: StockItemRepository,
    private readonly loyaltyPort: LoyaltyPort | null,
  ) {}

  async execute(input: VoidSaleInput): Promise<Order> {
    const order = await this.orderRepo.findById(input.orderId, input.companyId);
    if (!order) throw new Error(`Order ${input.orderId} not found`);

    // Same-session restriction (BR-SAL-006)
    VoidPolicy.assertSameSession(order.shiftSessionId, input.currentShiftSessionId);

    order.void(input.reason, input.currentShiftSessionId);

    // Reverse inventory outward events (SALE -> RETURN)
    const deps: StockOpDeps = {
      stockMovementRepo: this.stockMovementRepo,
      stockItemRepo: this.stockItemRepo,
      companyId: input.companyId,
      warehouseId: input.warehouseId,
    };
    for (const line of order.lines) {
      await restoreStock(
        deps,
        line.productVariantId,
        line.productVariantId,
        line.batchId,
        line.quantity,
        'Order',
        order.id,
      );
    }

    // Reverse loyalty accrual
    if (order.customerId && this.loyaltyPort) {
      await this.loyaltyPort.reverseOnReturn({
        returnId: order.id,
        customerId: order.customerId,
        originalOrderId: order.id,
        pointsToReverse: computeLoyaltyPoints(order.grandTotalPiasters),
      });
    }

    await this.orderRepo.save(order);
    return order;
  }
}

// ─── OpenDrawerSessionCommand ────────────────────────────────────────────────

export interface OpenDrawerSessionInput {
  companyId: string;
  branchId: string;
  cashierId: string;
}

export class OpenDrawerSessionCommand {
  async execute(input: OpenDrawerSessionInput): Promise<CashDrawerOpened> {
    return new CashDrawerOpened({
      drawerSessionId: Identifier.generate(),
      branchId: input.branchId,
      cashierId: input.cashierId,
      trigger: 'manager_no_sale',
    });
  }
}

// ─── OpenShiftCommand ────────────────────────────────────────────────────────

export interface OpenShiftInput {
  companyId: string;
  branchId: string;
  cashierId: string;
  openingCashPiasters: number;
}

export class OpenShiftCommand {
  constructor(private readonly shiftRepo: ShiftSessionRepository) {}

  async execute(input: OpenShiftInput): Promise<ShiftSession> {
    const open = await this.shiftRepo.findOpenForCashier(
      input.companyId,
      input.branchId,
      input.cashierId,
    );
    if (open) throw new Error('A shift session is already open for this cashier');

    const session = ShiftSession.open({
      companyId: input.companyId,
      branchId: input.branchId,
      cashierId: input.cashierId,
      openingCashPiasters: input.openingCashPiasters,
    });
    await this.shiftRepo.save(session);
    return session;
  }
}

// ─── CloseShiftCommand ───────────────────────────────────────────────────────

export interface CloseShiftInput {
  companyId: string;
  branchId: string;
  cashierId: string;
  shiftSessionId: string;
  closingCashPiasters: number;
}

export class CloseShiftCommand {
  constructor(private readonly shiftRepo: ShiftSessionRepository) {}

  async execute(input: CloseShiftInput): Promise<ShiftSession> {
    const session = await this.shiftRepo.findById(input.shiftSessionId);
    if (!session) throw new Error(`Shift session ${input.shiftSessionId} not found`);
    if (session.status !== 'open') throw new Error('Shift session is not open');
    if (session.cashierId !== input.cashierId)
      throw new Error('Shift session belongs to a different cashier');

    session.close(input.closingCashPiasters);
    await this.shiftRepo.save(session);
    return session;
  }
}

// ─── GetOrderQuery ───────────────────────────────────────────────────────────

export interface GetOrderQueryInput {
  companyId: string;
  orderId: string;
}

export class GetOrderQuery {
  constructor(private readonly orderRepo: OrderRepository) {}

  async execute(input: GetOrderQueryInput): Promise<Order | null> {
    return this.orderRepo.findById(input.orderId, input.companyId);
  }
}

// ─── GetShiftSummaryQuery ────────────────────────────────────────────────────

export interface ShiftSummaryLine {
  tenderType: string;
  count: number;
  totalPiasters: number;
}

export interface GetShiftSummaryResult {
  shiftSessionId: string;
  openedAt: string;
  closedAt: string | null;
  openingCashPiasters: number;
  closingCashPiasters: number | null;
  salesCount: number;
  salesTotalPiasters: number;
  returnsCount: number;
  returnsTotalPiasters: number;
  netTotalPiasters: number;
  paymentsByTender: ShiftSummaryLine[];
}

export interface GetShiftSummaryInput {
  companyId: string;
  branchId: string;
  cashierId: string;
  shiftSessionId?: string;
}

export class GetShiftSummaryQuery {
  constructor(
    private readonly shiftRepo: ShiftSessionRepository,
    private readonly orderRepo: OrderRepository,
    private readonly returnRepo: ReturnRepository,
  ) {}

  async execute(input: GetShiftSummaryInput): Promise<GetShiftSummaryResult> {
    let session = input.shiftSessionId
      ? await this.shiftRepo.findById(input.shiftSessionId)
      : await this.shiftRepo.findOpenForCashier(input.companyId, input.branchId, input.cashierId);
    if (!session) throw new Error('No active shift session found for cashier');

    const orders = await this.orderRepo.findByShiftSession(session.id);
    const completed = orders.filter((o) => o.status === 'completed');

    const tenderMap = new Map<string, ShiftSummaryLine>();
    let salesTotal = 0;
    for (const o of completed) {
      salesTotal += o.grandTotalPiasters;
      for (const p of o.payments) {
        const key = p.tenderType;
        const entry = tenderMap.get(key) ?? { tenderType: key, count: 0, totalPiasters: 0 };
        entry.count += 1;
        entry.totalPiasters += p.amountPiasters;
        tenderMap.set(key, entry);
      }
    }

    let returnsTotal = 0;
    let returnsCount = 0;
    for (const o of orders) {
      const returns = await this.returnRepo.findByOrder(o.id);
      for (const r of returns) {
        if (r.status === 'approved') {
          returnsTotal += r.refundAmountPiasters;
          returnsCount += 1;
        }
      }
    }

    return {
      shiftSessionId: session.id,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      openingCashPiasters: session.openingCashPiasters,
      closingCashPiasters: session.closingCashPiasters,
      salesCount: completed.length,
      salesTotalPiasters: salesTotal,
      returnsCount,
      returnsTotalPiasters: returnsTotal,
      netTotalPiasters: salesTotal - returnsTotal,
      paymentsByTender: [...tenderMap.values()],
    };
  }
}

export type {
  OrderRepository,
  ReturnRepository,
  ShiftSessionRepository,
  LoyaltyPort,
  BundleResolutionPort,
};
