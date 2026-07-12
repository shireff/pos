import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { client } from '../../lib/api/client';
import { ApiEndpoints } from '../../lib/api/endpoints';
import {
    createOrder,
    openShift,
    closeShift,
    fetchCurrentShift,
    type TenderType,
    type Order,
} from '../../lib/store/salesSlice';
import { useT, DigitalReceiptModal, type DigitalReceiptLine } from '@packages/ui-components';
import { getReceiptPrinter, getCashDrawer } from '../../lib/hardware';
import { PrinterNotAvailableError } from '@packages/infrastructure-hardware';

interface CartItem {
    key: string;
    productVariantId: string;
    productId: string;
    name: string;
    unitPricePiasters: number;
    quantity: number;
    discountPiasters: number;
}

interface SplitPayment {
    tenderType: TenderType;
    amountPiasters: number;
}

const TENDER_TYPES: TenderType[] = [
    'cash',
    'card',
    'vodafone_cash',
    'orange_cash',
    'etisalat_cash',
    'we_pay',
    'instapay',
    'bank_transfer',
    'customer_credit',
    'store_credit',
];

function toPiasters(value: string): number {
    const n = Math.round(Number(value) * 100);
    return Number.isFinite(n) ? n : 0;
}

function formatEgp(piasters: number): string {
    return (piasters / 100).toFixed(2);
}

export function PosRegisterPage() {
    const dispatch = useAppDispatch();
    const currentShift = useAppSelector((s) => s.sales.currentShift);
    const salesStatus = useAppSelector((s) => s.sales.status);
    const salesError = useAppSelector((s) => s.sales.error);

    const [scanned, setScanned] = useState('');
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Array<Record<string, unknown>>>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [payments, setPayments] = useState<SplitPayment[]>([]);
    const [showShiftClose, setShowShiftClose] = useState(false);
    const [closingCash, setClosingCash] = useState('');
    const [showDigitalReceipt, setShowDigitalReceipt] = useState(false);
    const [receiptLines, setReceiptLines] = useState<DigitalReceiptLine[]>([]);
    const [receiptOrderId, setReceiptOrderId] = useState('');
    const [drawerPrompt, setDrawerPrompt] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState<Array<{ id: string; name: string; phone: string }>>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [selectedCustomerName, setSelectedCustomerName] = useState('');

    const barcodeRef = useRef<HTMLInputElement>(null);
    const t = useT();

    useEffect(() => {
        void dispatch(fetchCurrentShift({}));
    }, [dispatch]);

    // Keep the barcode input always focused so HID wedge scans are captured.
    useEffect(() => {
        const onFocus = () => barcodeRef.current?.focus();
        window.addEventListener('click', onFocus);
        return () => window.removeEventListener('click', onFocus);
    }, []);

    const subtotalPiasters = cart.reduce((s, i) => s + i.unitPricePiasters * i.quantity, 0);
    const discountPiasters = cart.reduce((s, i) => s + i.discountPiasters, 0);
    const grandTotalPiasters = Math.max(0, subtotalPiasters - discountPiasters);
    const paidPiasters = payments.reduce((s, p) => s + p.amountPiasters, 0);
    const changePiasters = paidPiasters - grandTotalPiasters;

    const addToCart = useCallback((item: Omit<CartItem, 'key' | 'quantity' | 'discountPiasters'>) => {
        setCart((prev) => {
            const existing = prev.find((c) => c.productVariantId === item.productVariantId);
            if (existing) {
                return prev.map((c) =>
                    c.productVariantId === item.productVariantId
                        ? { ...c, quantity: c.quantity + 1 }
                        : c,
                );
            }
            return [
                ...prev,
                { ...item, key: `${item.productVariantId}-${Date.now()}`, quantity: 1, discountPiasters: 0 },
            ];
        });
    }, []);

    const handleScan = useCallback(
        async (code: string) => {
            const trimmed = code.trim();
            if (!trimmed) return;
            try {
                const resp = await client.get(
                    `${ApiEndpoints.ProductBarcode.replace(':id', trimmed)}`,
                ).catch(() => null);
                const product = resp?.data?.data;
                if (product) {
                    addToCart({
                        productVariantId: product.variantId ?? product.id,
                        productId: product.id,
                        name: product.name,
                        unitPricePiasters: product.pricePiasters ?? 0,
                    });
                    return;
                }
            } catch {
                // fall through to search
            }
            setSearch(trimmed);
            await runSearch(trimmed);
        },
        [addToCart],
    );

    const runSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setSearchResults([]);
            return;
        }
        const resp = await client.get(ApiEndpoints.Products, { params: { search: q, limit: 20 } });
        setSearchResults(resp?.data?.data ?? []);
    }, []);

    const runCustomerSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setCustomerResults([]);
            return;
        }
        try {
            const resp = await client.get(ApiEndpoints.Customers, { params: { query: q, limit: 10 } });
            setCustomerResults((resp?.data?.data ?? []).map((c: any) => ({ id: c.id, name: c.name, phone: c.phone })));
        } catch {
            setCustomerResults([]);
        }
    }, []);

    const printReceipt = async (order: Order) => {
        const lines: DigitalReceiptLine[] = cart.map((i) => ({
            name: i.name,
            qty: i.quantity,
            unitPricePiasters: i.unitPricePiasters,
            lineTotalPiasters: i.unitPricePiasters * i.quantity - i.discountPiasters,
        }));
        setReceiptLines(lines);
        setReceiptOrderId(order.id);

        const printer = getReceiptPrinter();
        try {
            if (!(await printer.isAvailable())) {
                setShowDigitalReceipt(true);
                return;
            }
            const res = await printer.print({
                orderId: order.id,
                lines,
                grandTotalPiasters,
                companyName: 'Smart Retail OS',
                branchName: currentShift?.id ?? 'Branch',
                cashierId: currentShift?.cashierId ?? 'cashier',
            });
            if (res.fallbackRequired) setShowDigitalReceipt(true);
        } catch (err) {
            if (err instanceof PrinterNotAvailableError) {
                // Sale already completed — fall back to on-screen receipt.
                setShowDigitalReceipt(true);
            } else {
                throw err;
            }
        }
    };

    // Cash-drawer pulse after a cash-tender sale. Failure must NOT block the
    // sale; the cashier is prompted to open the drawer manually (Hardware.md §4).
    const pulseDrawer = async () => {
        try {
            await getCashDrawer().open();
        } catch {
            setDrawerPrompt(true);
        }
    };

    const handleCompleteSale = async () => {
        if (cart.length === 0) return;
        const effectivePayments = payments.length
            ? payments
            : [{ tenderType: 'cash' as TenderType, amountPiasters: grandTotalPiasters }];

        const result = await dispatch(
            createOrder({
                branchId: 'branch-1',
                clientTxnId: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                shiftSessionId: currentShift?.id ?? null,
                customerId: selectedCustomerId,
                lines: cart.map((i) => ({
                    productVariantId: i.productVariantId,
                    productId: i.productId,
                    quantity: i.quantity,
                    unitPricePiasters: i.unitPricePiasters,
                    discountAmountPiasters: i.discountPiasters,
                })),
                payments: effectivePayments,
            }),
        );
        if (createOrder.fulfilled.match(result)) {
            const order = result.payload;
            await printReceipt(order);
            if (effectivePayments.some((p) => p.tenderType === 'cash')) {
                void pulseDrawer();
            }
            setCart([]);
            setPayments([]);
            setScanned('');
            setSearch('');
            setSearchResults([]);
            setSelectedCustomerId(null);
            setSelectedCustomerName('');
        }
    };

    return (
        <div className="pos-register" style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
            <header className="pos-header row" style={{ justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="row" style={{ gap: 'var(--space-4)' }}>
                    <strong>{t('pos.register')}</strong>
                    <span className="section-label">
                        {t('pos.shift')}: {currentShift ? currentShift.status : t('pos.none')}
                    </span>
                </div>
                <div className="row" style={{ gap: 'var(--space-2)' }}>
                    <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => void dispatch(openShift({ branchId: 'branch-1', openingCashPiasters: 0 }))}
                        disabled={Boolean(currentShift)}
                    >
                        {t('pos.openShift')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setShowShiftClose(true)}
                        disabled={!currentShift || currentShift.status !== 'open'}
                    >
                        {t('pos.closeShift')}
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}>
                <section className="pos-main" style={{ padding: 'var(--space-4)', overflow: 'auto' }}>
                    <input
                        ref={barcodeRef}
                        autoFocus
                        className="form-input"
                        placeholder={t('pos.scanBarcode')}
                        value={scanned}
                        onChange={(e) => setScanned(e.target.value)}
                        onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                                await handleScan(scanned);
                                setScanned('');
                            }
                        }}
                    />
                    <div className="row" style={{ gap: 'var(--space-2)', marginBlock: 'var(--space-3)' }}>
                        <input
                            className="form-input"
                            placeholder={t('pos.searchProduct')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => runSearch(search)}>
                            {t('pos.search')}
                        </button>
                    </div>

                    {searchResults.length > 0 && (
                        <ul className="list" style={{ marginBlockEnd: 'var(--space-4)' }}>
                            {searchResults.map((p: any) => (
                                <li key={p.id} className="row" style={{ justifyContent: 'space-between' }}>
                                    <span>
                                        {p.name} — {formatEgp(p.pricePiasters ?? 0)} EGP
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn-sm"
                                        onClick={() =>
                                            addToCart({
                                                productVariantId: p.variantId ?? p.id,
                                                productId: p.id,
                                                name: p.name,
                                                unitPricePiasters: p.pricePiasters ?? 0,
                                            })
                                        }
                                    >
                                        {t('pos.addToCart')}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {salesError && <div className="error-banner">{salesError}</div>}
                </section>

                <aside className="pos-cart" style={{ borderLeft: '1px solid var(--color-border)', padding: 'var(--space-4)', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <h3 style={{ margin: 0 }}>Cart</h3>
                    {cart.length === 0 && <p className="section-label">{t('pos.noItems')}</p>}
                    {cart.map((item) => (
                        <div key={item.key} className="card" style={{ padding: 'var(--space-3)' }}>
                            <div className="row" style={{ justifyContent: 'space-between' }}>
                                <strong>{item.name}</strong>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCart((c) => c.filter((x) => x.key !== item.key))}>
                                    {t('common.remove')}
                                </button>
                            </div>
                            <div className="row" style={{ gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                                <button type="button" className="btn btn-sm" onClick={() => setCart((c) => c.map((x) => (x.key === item.key ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x)))}>−</button>
                                <span className="num">{item.quantity}</span>
                                <button type="button" className="btn btn-sm" onClick={() => setCart((c) => c.map((x) => (x.key === item.key ? { ...x, quantity: x.quantity + 1 } : x)))}>+</button>
                                <span className="section-label">{formatEgp(item.unitPricePiasters)} EGP</span>
                            </div>
                            <div className="row" style={{ gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                                <input
                                    className="form-input num"
                                    style={{ width: 90 }}
                                    placeholder={t('pos.amount')}
                                    onChange={(e) =>
                                        setCart((c) =>
                                            c.map((x) =>
                                                x.key === item.key
                                                    ? { ...x, discountPiasters: toPiasters(e.target.value) }
                                                    : x,
                                            ),
                                        )
                                    }
                                />
                                <span className="num">= {formatEgp(item.unitPricePiasters * item.quantity - item.discountPiasters)} EGP</span>
                            </div>
                        </div>
                    ))}

                    <div className="row" style={{ justifyContent: 'space-between' }}>
                        <span>{t('pos.subtotal')}</span>
                        <span className="num">{formatEgp(subtotalPiasters)} EGP</span>
                    </div>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                        <span>{t('pos.discount')}</span>
                        <span className="num">−{formatEgp(discountPiasters)} EGP</span>
                    </div>
                    <div className="row" style={{ justifyContent: 'space-between', fontWeight: 700 }}>
                        <span>{t('pos.total')}</span>
                        <span className="num">{formatEgp(grandTotalPiasters)} EGP</span>
                    </div>

                    <h4 style={{ marginBlockEnd: 0 }}>{t('pos.payments')}</h4>
                    <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                        {TENDER_TYPES.map((t) => (
                            <button
                                key={t}
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => setPayments((p) => [...p, { tenderType: t, amountPiasters: grandTotalPiasters - paidPiasters }])}
                            >
                                {t.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    {payments.map((p, idx) => (
                        <div key={idx} className="row" style={{ gap: 'var(--space-2)' }}>
                            <span className="section-label" style={{ width: 110 }}>                                {t(`pos.${p.tenderType}`)}</span>
                            <input
                                className="form-input num"
                                defaultValue={(p.amountPiasters / 100).toFixed(2)}
                                onChange={(e) =>
                                    setPayments((ps) => ps.map((x, i) => (i === idx ? { ...x, amountPiasters: toPiasters(e.target.value) } : x)))
                                }
                            />
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPayments((ps) => ps.filter((_, i) => i !== idx))}>✕</button>
                        </div>
                    ))}
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                        <span>{t('pos.paid')}</span>
                        <span className="num">{formatEgp(paidPiasters)} EGP</span>
                    </div>
                    {changePiasters > 0 && (
                        <div className="row" style={{ justifyContent: 'space-between', color: 'var(--color-success)' }}>
                            <span>{t('pos.change')}</span>
                            <span className="num">{formatEgp(changePiasters)} EGP</span>
                        </div>
                    )}

                    <button
                        type="button"
                        className="btn btn-primary"
                        disabled={cart.length === 0 || salesStatus === 'loading'}
                        onClick={handleCompleteSale}
                    >
                        {salesStatus === 'loading' ? t('pos.processing') : t('pos.completeSale')}
                    </button>

                    {drawerPrompt && (
                        <div className="error-banner" role="status">
                            {t('pos.pleaseOpenDrawer')}
                        </div>
                    )}
                </aside>
            </div>

            <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <input
                    className="form-input"
                    placeholder={t('pos.searchCustomer')}
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); runCustomerSearch(e.target.value); }}
                />
                    {selectedCustomerId && <span className="section-label">{t('pos.customer')}: {selectedCustomerName}</span>}
                {customerResults.length > 0 && (
                    <select className="form-select" value="" onChange={(e) => {
                        const selected = customerResults.find((r) => r.id === e.target.value);
                        if (selected) {
                            setSelectedCustomerId(selected.id);
                            setSelectedCustomerName(selected.name);
                            setCustomerResults([]);
                            setCustomerSearch('');
                        }
                    }}>
                        <option value="">{t('pos.selectCustomer')}</option>
                        {customerResults.map((r) => (
                            <option key={r.id} value={r.id}>{r.name} — {r.phone}</option>
                        ))}
                    </select>
                )}
                    {selectedCustomerId && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSelectedCustomerId(null); setSelectedCustomerName(''); }}>{t('pos.clearCustomer')}</button>
                    )}
            </div>

            {showShiftClose && (
                <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowShiftClose(false)}>
                    <div className="card" style={{ maxWidth: 360, margin: 'auto', padding: 'var(--space-4)' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{t('pos.closeShift')}</h3>
                        <p className="section-label">{t('pos.openingCash')}: {formatEgp(currentShift?.openingCashPiasters ?? 0)} EGP</p>
                        <Field label={t('pos.actualCash')}>
                            <input className="form-input num" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} placeholder="0.00" />
                        </Field>
                        <div className="row" style={{ justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowShiftClose(false)}>{t('pos.cancel')}</button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => {
                                    if (!currentShift) return;
                                    void dispatch(closeShift({ shiftSessionId: currentShift.id, closingCashPiasters: toPiasters(closingCash) }));
                                    setShowShiftClose(false);
                                    setClosingCash('');
                                }}
                            >
                                {t('pos.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <DigitalReceiptModal
                open={showDigitalReceipt}
                onClose={() => setShowDigitalReceipt(false)}
                orderId={receiptOrderId}
                companyName="Smart Retail OS"
                branchName={currentShift?.id ?? 'Branch'}
                cashierId={currentShift?.cashierId ?? 'cashier'}
                lines={receiptLines}
                subtotalPiasters={subtotalPiasters}
                discountPiasters={discountPiasters}
                taxPiasters={0}
                grandTotalPiasters={grandTotalPiasters}
            />
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="field" style={{ marginBlock: 'var(--space-3)' }}>
            <span className="section-label">{label}</span>
            {children}
        </div>
    );
}
