# @packages/domain-catalog

Pure domain entities, value objects, and events for the **catalog** bounded context.

## Current aggregate contracts

- `Product`: core catalog aggregate with category linkage, unit metadata, variant collection, and bundle configuration hooks.
- `ProductVariant`: SKU/barcode-backed variant with price and cost deltas plus flexible attributes.
- `Category`: hierarchical catalog grouping for product organization.
- `UnitOfMeasure`: conversion-factor-based unit definition for quantity math.
- `Barcode`: EAN-13 and Code128 validation value object with checksum enforcement.

## Domain services

- `BarcodeGenerator`: produces EAN-13 barcodes from a 12-digit payload.
- `UnitConversionService`: converts quantities with integer-safe arithmetic.
- `CategoryTreeService`: validates and archives category hierarchies safely.
