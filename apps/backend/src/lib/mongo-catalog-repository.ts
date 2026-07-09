import { Category, Product, UnitOfMeasure } from '@packages/domain-catalog';
import { HybridLogicalClock } from '@packages/shared-kernel';
import { getMongoDb } from './cloud-db';
import {
  writeOutboxEvent,
  categoryOutboxEvent,
  unitOutboxEvent,
} from './outbox';

export class MongoCategoryRepository {
  async findById(id: string, companyId: string): Promise<Category | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('categories').findOne({ _id: id, company_id: companyId });
    if (!doc) return null;
    return Category.reconstitute({
      id: doc._id.toString(),
      companyId: doc.company_id.toString(),
      name: doc.name,
      parentId: doc.parent_id ? doc.parent_id.toString() : null,
      sortOrder: doc.sort_order,
      level: doc.level,
      path: doc.path,
      isDeleted: doc.is_deleted,
    } as any);
  }

  async findAll(companyId: string): Promise<Category[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('categories')
      .find({ company_id: companyId, is_deleted: { $ne: true } })
      .toArray();
    return docs.map((doc) =>
      Category.reconstitute({
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        name: doc.name,
        parentId: doc.parent_id ? doc.parent_id.toString() : null,
        sortOrder: doc.sort_order,
        level: doc.level,
        path: doc.path,
        isDeleted: doc.is_deleted,
      } as any),
    );
  }

  async findChildren(parentId: string | null, companyId: string): Promise<Category[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('categories')
      .find({
        company_id: companyId,
        parent_id: parentId,
        is_deleted: { $ne: true },
      })
      .toArray();
    return docs.map((doc) =>
      Category.reconstitute({
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        name: doc.name,
        parentId: doc.parent_id ? doc.parent_id.toString() : null,
        sortOrder: doc.sort_order,
        level: doc.level,
        path: doc.path,
        isDeleted: doc.is_deleted,
      } as any),
    );
  }

  async findByPath(pathPrefix: string, companyId: string): Promise<Category[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('categories')
      .find({
        company_id: companyId,
        path: { $regex: '^' + pathPrefix },
        is_deleted: { $ne: true },
      })
      .toArray();
    return docs.map((doc) =>
      Category.reconstitute({
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        name: doc.name,
        parentId: doc.parent_id ? doc.parent_id.toString() : null,
        sortOrder: doc.sort_order,
        level: doc.level,
        path: doc.path,
        isDeleted: doc.is_deleted,
      } as any),
    );
  }

  async hasActiveProducts(categoryId: string, companyId: string): Promise<boolean> {
    const db = await getMongoDb();
    const count = await db.collection<any>('products').countDocuments({
      category_id: categoryId,
      company_id: companyId,
      is_deleted: { $ne: true },
    });
    return count > 0;
  }

  async save(category: Category): Promise<void> {
    const db = await getMongoDb();
    const snap = category as any;
    const hlc = HybridLogicalClock.generateInitial('server').advance();

    await db.collection<any>('categories').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          name: snap.name,
          parent_id: snap.parentId,
          sort_order: snap.sortOrder,
          level: snap.level,
          path: snap.path,
          is_deleted: snap.isDeleted ?? false,
          hlc_timestamp: hlc.toString(),
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true },
    );

    // Determine event type from document state.
    const isNew = snap.createdAt === snap.updatedAt;
    const eventType = snap.isDeleted
      ? 'CategoryDeleted'
      : isNew
        ? 'CategoryCreated'
        : 'CategoryUpdated';

    await writeOutboxEvent(
      categoryOutboxEvent(eventType as any, snap.id, {
        companyId: snap.companyId,
        name: snap.name,
        parentId: snap.parentId,
        sortOrder: snap.sortOrder,
        level: snap.level,
        path: snap.path,
        isDeleted: snap.isDeleted ?? false,
      }),
      db,
    );
  }

  async saveAll(categories: Category[]): Promise<void> {
    for (const c of categories) {
      await this.save(c);
    }
  }
}

export class MongoProductRepository {
  async findById(id: string, companyId: string): Promise<Product | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('products').findOne({ _id: id, company_id: companyId });
    if (!doc) return null;

    const [variantDocs, unitDocs, bundleDocs] = await Promise.all([
      db.collection<any>('product_variants').find({ product_id: id, is_deleted: { $ne: true } }).toArray(),
      db.collection<any>('product_units').find({ product_id: id }).toArray(),
      db.collection<any>('bundle_components').find({ bundle_product_id: id }).toArray(),
    ]);

    const variants = variantDocs.map((v: any) => ({
      id: v._id.toString(),
      productId: id,
      sku: v.sku,
      barcode: v.barcode ?? null,
      attributesJson: v.attributes_json ?? {},
      pricePiasters: v.price_piasters ?? 0,
      costPiasters: v.cost_piasters ?? 0,
      isDeleted: v.is_deleted ?? false,
    }));

    const units = unitDocs.map((u: any) => ({
      id: u._id.toString(),
      productId: id,
      unitName: u.unit_name,
      conversionFactorToBase: u.conversion_factor_to_base ?? 1,
      isBaseUnit: u.is_base_unit ?? false,
    }));

    const bundleComponents = bundleDocs.map((b: any) => ({
      bundleVariantId: id,
      componentVariantId: b.component_variant_id?.toString() ?? '',
      quantity: b.quantity ?? 0,
    }));

    return Product.reconstitute(
      {
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        categoryId: doc.category_id ? doc.category_id.toString() : null,
        name: doc.name,
        description: doc.description || '',
        baseUnitId: doc.base_unit_id ? doc.base_unit_id.toString() : null,
        productType: (doc.product_type || 'simple') as any,
        isBundle: doc.is_bundle ?? false,
        isSerialized: doc.is_serialized ?? false,
        requiresBatchTracking: doc.requires_batch_tracking ?? false,
        isDeleted: doc.is_deleted ?? false,
        createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
        updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
      },
      variants,
      units,
      bundleComponents,
    );
  }

  async findByBarcode(barcode: string, companyId: string): Promise<Product | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('products').findOne({ barcode, company_id: companyId });
    if (!doc) return null;
    return Product.reconstitute(
      {
        id: doc._id.toString(),
        companyId: doc.company_id.toString(),
        categoryId: doc.category_id ? doc.category_id.toString() : null,
        name: doc.name,
        description: doc.description || '',
        baseUnitId: doc.base_unit_id ? doc.base_unit_id.toString() : null,
        productType: (doc.product_type || 'simple') as any,
        isBundle: doc.is_bundle ?? false,
        isSerialized: doc.is_serialized ?? false,
        requiresBatchTracking: doc.requires_batch_tracking ?? false,
        isDeleted: doc.is_deleted ?? false,
        createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
        updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
      },
      [],
      [],
      [],
    );
  }

  async findAll(
    companyId: string,
    filter?: { categoryId?: string; isDeleted?: boolean },
  ): Promise<Product[]> {
    const db = await getMongoDb();
    const query: any = { company_id: companyId };
    if (filter?.categoryId) query.category_id = filter.categoryId;
    if (filter?.isDeleted !== undefined) query.is_deleted = filter.isDeleted;

    const docs = await db.collection<any>('products').find(query).toArray();
    return Promise.all(
      docs.map(async (doc) => {
        const id = doc._id.toString();
        const [variantDocs, unitDocs] = await Promise.all([
          db.collection<any>('product_variants').find({ product_id: id, is_deleted: { $ne: true } }).toArray(),
          db.collection<any>('product_units').find({ product_id: id }).toArray(),
        ]);

        const variants = variantDocs.map((v: any) => ({
          id: v._id.toString(),
          productId: id,
          sku: v.sku,
          barcode: v.barcode ?? null,
          attributesJson: v.attributes_json ?? {},
          pricePiasters: v.price_piasters ?? 0,
          costPiasters: v.cost_piasters ?? 0,
          isDeleted: v.is_deleted ?? false,
        }));

        const units = unitDocs.map((u: any) => ({
          id: u._id.toString(),
          productId: id,
          unitName: u.unit_name,
          conversionFactorToBase: u.conversion_factor_to_base ?? 1,
          isBaseUnit: u.is_base_unit ?? false,
        }));

        return Product.reconstitute(
          {
            id,
            companyId: doc.company_id.toString(),
            categoryId: doc.category_id ? doc.category_id.toString() : null,
            name: doc.name,
            description: doc.description || '',
            baseUnitId: doc.base_unit_id ? doc.base_unit_id.toString() : null,
            productType: (doc.product_type || 'simple') as any,
            isBundle: doc.is_bundle ?? false,
            isSerialized: doc.is_serialized ?? false,
            requiresBatchTracking: doc.requires_batch_tracking ?? false,
            isDeleted: doc.is_deleted ?? false,
            createdAt: doc.created_at?.toISOString() || new Date().toISOString(),
            updatedAt: doc.updated_at?.toISOString() || new Date().toISOString(),
          },
          variants,
          units,
          [],
        );
      }),
    );
  }

  async save(product: Product): Promise<void> {
    const db = await getMongoDb();
    const snap = product as any;
    await db.collection<any>('products').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.companyId,
          category_id: snap.categoryId,
          name: snap.name,
          description: snap.description,
          base_unit_id: snap.baseUnitId,
          product_type: snap.productType,
          is_bundle: snap.isBundle,
          is_serialized: snap.isSerialized,
          requires_batch_tracking: snap.requiresBatchTracking,
          is_deleted: snap.isDeleted,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true },
    );

    for (const variant of snap.variants) {
      await db.collection<any>('product_variants').updateOne(
        { _id: variant.id },
        {
          $set: {
            product_id: snap.id,
            sku: variant.sku,
            barcode: variant.barcode,
            attributes_json: variant.attributesJson,
            price_piasters: variant.pricePiasters,
            cost_piasters: variant.costPiasters,
            is_deleted: variant.isDeleted ?? false,
            updated_at: new Date(),
          },
          $setOnInsert: {
            created_at: new Date(),
          },
        },
        { upsert: true },
      );
    }

    for (const unit of snap.units) {
      await db.collection<any>('product_units').updateOne(
        { _id: unit.id },
        {
          $set: {
            product_id: snap.id,
            unit_name: unit.unitName,
            conversion_factor_to_base: unit.conversionFactorToBase,
            is_base_unit: unit.isBaseUnit,
            updated_at: new Date(),
          },
          $setOnInsert: {
            created_at: new Date(),
          },
        },
        { upsert: true },
      );
    }

    const existingBundleIds = new Set(
      (await db.collection<any>('bundle_components').find({ bundle_product_id: snap.id }).toArray()).map(
        (b: any) => b._id.toString(),
      ),
    );
    const savedIds = new Set<string>();

    for (const component of snap.bundleComponents) {
      const componentId = component.bundleVariantId + '-' + component.componentVariantId;
      savedIds.add(componentId);
      await db.collection<any>('bundle_components').updateOne(
        { _id: componentId },
        {
          $set: {
            bundle_product_id: snap.id,
            component_variant_id: component.componentVariantId,
            quantity: component.quantity,
            updated_at: new Date(),
          },
          $setOnInsert: {
            created_at: new Date(),
          },
        },
        { upsert: true },
      );
    }

    for (const oldId of existingBundleIds) {
      if (!savedIds.has(oldId)) {
        await db.collection<any>('bundle_components').deleteOne({ _id: oldId });
      }
    }
  }

  async isBarcodeUnique(
    barcode: string,
    companyId: string,
    excludeVariantId?: string,
  ): Promise<boolean> {
    const db = await getMongoDb();
    const query: any = { barcode, company_id: companyId };
    if (excludeVariantId) {
      query._id = { $ne: excludeVariantId };
    }
    const count = await db.collection<any>('products').countDocuments(query);
    return count === 0;
  }

  async hasOpenPurchaseOrderLines(productId: string, companyId: string): Promise<boolean> {
    const db = await getMongoDb();
    const product = await db.collection<any>('products').findOne({ _id: productId, company_id: companyId });
    if (!product) return false;

    const variants = await db.collection<any>('product_variants').find({ product_id: productId }).toArray();
    const variantIds = variants.map((v: any) => v._id.toString());
    if (variantIds.length === 0) return false;

    const lines = await db.collection<any>('purchase_order_lines').find({
      product_variant_id: { $in: variantIds },
    }).toArray();

    if (lines.length === 0) return false;

    const poIds = lines.map((l: any) => l.purchase_order_id).filter(Boolean);
    const pos = await db.collection<any>('purchase_orders').find({
      _id: { $in: poIds },
      status: { $nin: ['received', 'cancelled'] },
    }).toArray();

    return pos.length > 0;
  }
}

export class MongoUnitRepository {
  async findById(id: string, companyId: string): Promise<UnitOfMeasure | null> {
    const db = await getMongoDb();
    const doc = await db.collection<any>('units').findOne({ _id: id, company_id: companyId });
    if (!doc) return null;
    return UnitOfMeasure.reconstitute({
      id: doc._id.toString(),
      productId: doc.company_id.toString(),
      unitName: doc.abbreviation,
      isBaseUnit: doc.is_base_unit,
      conversionFactorToBase: doc.conversion_factor_to_base,
    });
  }

  async findAll(companyId: string): Promise<UnitOfMeasure[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<any>('units')
      .find({ company_id: companyId, is_deleted: { $ne: true } })
      .toArray();
    return docs.map((doc) =>
      UnitOfMeasure.reconstitute({
        id: doc._id.toString(),
        productId: doc.company_id.toString(),
        unitName: doc.abbreviation,
        isBaseUnit: doc.is_base_unit,
        conversionFactorToBase: doc.conversion_factor_to_base,
      }),
    );
  }

  async existsByAbbreviation(
    abbreviation: string,
    companyId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const db = await getMongoDb();
    const query: any = { abbreviation, company_id: companyId, is_deleted: { $ne: true } };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const count = await db.collection<any>('units').countDocuments(query);
    return count > 0;
  }

  async hasActiveProductReferences(unitId: string, companyId: string): Promise<boolean> {
    const db = await getMongoDb();
    const count = await db.collection<any>('products').countDocuments({
      base_unit_id: unitId,
      company_id: companyId,
      is_deleted: { $ne: true },
    });
    return count > 0;
  }

  async save(unit: UnitOfMeasure): Promise<void> {
    const db = await getMongoDb();
    const snap = unit as any;
    const hlc = HybridLogicalClock.generateInitial('server').advance();

    const result = await db.collection<any>('units').updateOne(
      { _id: snap.id },
      {
        $set: {
          company_id: snap.productId,
          name: { ar: snap.unitName },
          abbreviation: snap.unitName,
          is_base_unit: snap.isBaseUnit,
          conversion_factor_to_base: snap.conversionFactorToBase,
          is_deleted: false,
          hlc_timestamp: hlc.toString(),
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true },
    );

    const eventType = result.upsertedCount > 0 ? 'UnitCreated' : 'UnitUpdated';

    await writeOutboxEvent(
      unitOutboxEvent(eventType, snap.id, {
        companyId: snap.productId,
        abbreviation: snap.unitName,
        isBaseUnit: snap.isBaseUnit,
        conversionFactorToBase: snap.conversionFactorToBase,
      }),
      db,
    );
  }
}
