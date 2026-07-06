/**
 * TenderType enumerates all supported payment methods at point of sale.
 */
export type TenderType =
  | 'cash'
  | 'card'
  | 'vodafone_cash'
  | 'orange_cash'
  | 'etisalat_cash'
  | 'we_pay'
  | 'instapay'
  | 'bank_transfer'
  | 'customer_credit'
  | 'store_credit';

export type OrderStatus = 'completed' | 'partially_returned' | 'fully_returned' | 'voided';
export type ReturnStatus = 'pending_approval' | 'approved' | 'rejected';
export type RefundMethod = TenderType | 'store_credit';
