export interface ProductSyncEnvelope {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export function createProductSyncEnvelope(
  productId: string,
  eventType: string,
  payload: Record<string, unknown>,
): ProductSyncEnvelope {
  return {
    aggregateType: 'Product',
    aggregateId: productId,
    eventType,
    payload,
  };
}

export function detectPriceConflict(
  localPayload: Record<string, unknown>,
  remotePayload: Record<string, unknown>,
): boolean {
  return (
    localPayload.sellingPrice !== remotePayload.sellingPrice ||
    localPayload.costPrice !== remotePayload.costPrice
  );
}
