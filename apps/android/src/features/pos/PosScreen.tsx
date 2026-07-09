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
    type OrderLine,
} from '../../lib/store/salesSlice';

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

export function PosScreen() {
    const dispatch = useAppDispatch();
    const currentShift = useAppSelector((s) => s.sales.currentShift);
    const salesStatus = useAppSelector((s) => s.sales.status);

    const [scanned, setScanned] = useState('');
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Array<Record<string, unknown>>>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [payments, setPayments] = useState<SplitPayment[]>([]);
    const [showSheet, setShowSheet] = useState(false);
    const [closingCash, setClosingCash] = useState('');
    const [showShiftClose, setShowShiftClose] = useState(false);
    const barcodeRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        void dispatch(fetchCurrentShift({}));
    }, [dispatch]);

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
                    c.productVariantId === item.productVariantId ? { ...c, quantity: c.quantity + 1 } : c,
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
                const resp = await client
                    .get(`${ApiEndpoints.ProductBarcode.replace(':id', trimmed)}`)
                    .catch(() => null);
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
                // fall through
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

    const handleCompleteSale = async () => {
        if (cart.length === 0) return;
        const effectivePayments = payments.length
            ? payments
            : [{ tenderType: 'cash' as TenderType, amountPiasters: grandTotalPiasters }];
        await dispatch(
            createOrder({
                branchId: 'branch-1',
                clientTxnId: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                shiftSessionId: currentShift?.id ?? null,
                customerId: null,
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
        setCart([]);
        setPayments([]);
        setScanned('');
        setShowSheet(false);
    };

    return (
        <div className="pos-register" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
            <header className="row" style={{ justifyContent: 'space-between', padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
                <strong>POS</strong>
                <div className="row" style={{ gap: 'var(--space-2)' }}>
                    <button type="button" className="btn btn-sm btn-secondary" disabled={Boolean(currentShift)} onClick={() => void dispatch(openShift({ branchId: 'branch-1', openingCashPiasters: 0 }))}>Open Shift</button>
                    <button type="button" className="btn btn-sm" disabled={!currentShift || currentShift.status !== 'open'} onClick={() => setShowShiftClose(true)}>Close</button>
                </div>
            </header>

            <div style={{ padding: 'var(--space-3)' }}>
                <input
                    ref={barcodeRef}
                    autoFocus
                    className="form-input"
                    placeholder="Scan barcode or search…"
                    value={scanned}
                    onChange={(e) => setScanned(e.target.value)}
                    onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                            await handleScan(scanned);
                            setScanned('');
                        }
                    }}
                />
                <div className="row" style={{ gap: 'var(--space-2)', marginBlock: 'var(--space-2)' }}>
                    <input className="form-input" placeholder="Search product…" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => runSearch(search)}>Search</button>
                </div>
                {searchResults.length > 0 && (
                    <ul className="list">
                        {searchResults.map((p: any) => (
                            <li key={p.id} className="row" style={{ justifyContent: 'space-between' }}>
                                <span>{p.name} — {formatEgp(p.pricePiasters ?? 0)}</span>
                                <button type="button" className="btn btn-sm" onClick={() => addToCart({ productVariantId: p.variantId ?? p.id, productId: p.id, name: p.name, unitPricePiasters: p.pricePiasters ?? 0 })}>Add</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div style={{ flex: 1, padding: 'var(--space-3)', overflowY: 'auto' }}>
                {cart.length === 0 && <p className="section-label">No items scanned yet.</p>}
                {cart.map((item) => (
                    <div key={item.key} className="card" style={{ padding: 'var(--space-3)', marginBlockEnd: 'var(--space-2)' }}>
                        <div className="row" style={{ justifyContent: 'space-between' }}>
                            <strong>{item.name}</strong>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCart((c) => c.filter((x) => x.key !== item.key))}>✕</button>
                        </div>
                        <div className="row" style={{ gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                            <button type="button" className="btn btn-sm" onClick={() => setCart((c) => c.map((x) => (x.key === item.key ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x)))}>−</button>
                            <span className="num">{item.quantity}</span>
                            <button type="button" className="btn btn-sm" onClick={() => setCart((c) => c.map((x) => (x.key === item.key ? { ...x, quantity: x.quantity + 1 } : x)))}>+</button>
                            <span className="num">= {formatEgp(item.unitPricePiasters * item.quantity - item.discountPiasters)} EGP</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
                <div className="row" style={{ justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>Total</span>
                    <span className="num">{formatEgp(grandTotalPiasters)} EGP</span>
                </div>
                <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 'var(--space-3)' }} disabled={cart.length === 0 || salesStatus === 'loading'} onClick={() => setShowSheet(true)}>
                    {salesStatus === 'loading' ? 'Processing…' : 'Charge'}
                </button>
            </div>

            {showSheet && (
                <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowSheet(false)}>
                    <div className="sheet-bottom" onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>Payment</h3>
                        <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                            {TENDER_TYPES.map((t) => (
                                <button key={t} type="button" className="btn btn-sm btn-secondary" onClick={() => setPayments((p) => [...p, { tenderType: t, amountPiasters: Math.max(0, grandTotalPiasters - paidPiasters) }])}>
                                    {t.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                        {payments.map((p, idx) => (
                            <div key={idx} className="row" style={{ gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                                <span className="section-label" style={{ width: 120 }}>{p.tenderType}</span>
                                <input className="form-input num" defaultValue={(p.amountPiasters / 100).toFixed(2)} onChange={(e) => setPayments((ps) => ps.map((x, i) => (i === idx ? { ...x, amountPiasters: toPiasters(e.target.value) } : x)))} />
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPayments((ps) => ps.filter((_, i) => i !== idx))}>✕</button>
                            </div>
                        ))}
                        {changePiasters > 0 && <p className="section-label" style={{ color: 'var(--color-success)' }}>Change: {formatEgp(changePiasters)} EGP</p>}
                        <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 'var(--space-3)' }} disabled={paidPiasters < grandTotalPiasters} onClick={handleCompleteSale}>
                            Pay {formatEgp(grandTotalPiasters)} EGP
                        </button>
                    </div>
                </div>
            )}

            {showShiftClose && (
                <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowShiftClose(false)}>
                    <div className="card" style={{ maxWidth: 360, margin: 'auto', padding: 'var(--space-4)' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>Close Shift</h3>
                        <p className="section-label">Opening: {formatEgp(currentShift?.openingCashPiasters ?? 0)} EGP</p>
                        <input className="form-input num" placeholder="Actual cash (EGP)" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} />
                        <div className="row" style={{ justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowShiftClose(false)}>Cancel</button>
                            <button type="button" className="btn btn-primary" onClick={() => { if (currentShift) void dispatch(closeShift({ shiftSessionId: currentShift.id, closingCashPiasters: toPiasters(closingCash) })); setShowShiftClose(false); setClosingCash(''); }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
