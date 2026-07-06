import { Order } from '@packages/domain-sales';
import { Return } from '@packages/domain-sales';

export interface OrderRepository {
  findById(id: string, branchId: string): Promise<Order | null>;
  findByClientTxnId(clientTxnId: string, branchId: string): Promise<Order | null>;
  findByBranch(branchId: string, from: string, to: string): Promise<Order[]>;
  save(order: Order): Promise<void>;
}

export interface ReturnRepository {
  findById(id: string): Promise<Return | null>;
  findPendingApproval(branchId: string): Promise<Return[]>;
  save(returnEntity: Return): Promise<void>;
}

/** Port: ReceiptPrinter — implemented in infrastructure/hardware */
export interface ReceiptPrinter {
  print(receipt: {
    orderId: string;
    lines: Array<{ name: string; qty: number; unitPricePiasters: number }>;
    grandTotalPiasters: number;
    companyName: string;
    branchName: string;
    cashierId: string;
  }): Promise<{ success: boolean; fallbackRequired: boolean }>;
  isAvailable(): Promise<boolean>;
}

/** Port: CashDrawer — implemented in infrastructure/hardware */
export interface CashDrawer {
  open(): Promise<{ success: boolean }>;
}
