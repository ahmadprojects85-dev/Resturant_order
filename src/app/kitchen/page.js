"use client";
import { useState, useEffect, useRef } from 'react';
import { playNotificationSound } from '@/lib/sound';
import ServiceAlerts from '@/components/ServiceAlerts';

export default function KitchenPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newOrderIds, setNewOrderIds] = useState(new Set());
    const knownOrderIdsRef = useRef(new Set());
    const isFirstLoadRef = useRef(true);
    const [billData, setBillData] = useState(null); // { table, orders, grandTotal }
    const [activeTables, setActiveTables] = useState([]);

    useEffect(() => {
        fetchOrders();
        fetchActiveTables();
        const interval = setInterval(() => {
            fetchOrders();
            fetchActiveTables();
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    async function fetchOrders() {
        try {
            const res = await fetch('/api/kitchen/orders');
            if (!res.ok) {
                if (res.status === 404) {
                    console.warn("Kitchen API endpoint not found. Ensure the server is running.");
                } else {
                    console.error("Kitchen API Error:", res.statusText);
                }
                return;
            }

            const data = await res.json();
            if (!Array.isArray(data)) {
                console.error("Invalid data format from Kitchen API:", data);
                return;
            }

            const currentOrderIds = data.map(o => o.id);
            const newIds = currentOrderIds.filter(id => !knownOrderIdsRef.current.has(id));

            if (newIds.length > 0 && !isFirstLoadRef.current) {
                playNotificationSound();
                setNewOrderIds(new Set(newIds));
                setTimeout(() => setNewOrderIds(new Set()), 3000);
            }

            // Sync known IDs
            currentOrderIds.forEach(id => knownOrderIdsRef.current.add(id));
            isFirstLoadRef.current = false;
            setOrders(data);
        } catch (error) {
            console.warn("Kitchen Order Polling Error:", error.message);
        } finally {
            setLoading(false);
        }
    }

    async function fetchActiveTables() {
        try {
            const res = await fetch('/api/kitchen/sessions');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setActiveTables(data);
            }
        } catch (e) {
            // silent
        }
    }

    async function updateStatus(orderId, newStatus) {
        try {
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: newStatus } : o
            ));

            await fetch(`/api/kitchen/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            fetchOrders();
        } catch (error) {
            console.error("Failed to update status", error);
        }
    }

    async function handlePrintBill(tableId) {
        try {
            const res = await fetch(`/api/table/${tableId}/session`);
            if (res.ok) {
                const data = await res.json();
                setBillData(data);
            }
        } catch (e) {
            console.error("Failed to fetch bill:", e);
        }
    }

    async function handleCloseTable(tableId, tableLabel) {
        if (!confirm(`Close Table ${tableLabel}? This will end the current session and prepare for the next customer.`)) return;
        try {
            const res = await fetch(`/api/table/${tableId}/session`, { method: 'POST' });
            if (res.ok) {
                setBillData(null);
                fetchOrders();
            }
        } catch (e) {
            console.error("Failed to close table:", e);
        }
    }

    const received = orders.filter(o => o.status === 'RECEIVED');
    const preparing = orders.filter(o => o.status === 'PREPARING');
    const ready = orders.filter(o => o.status === 'READY');

    if (loading && orders.length === 0) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'var(--brown-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
            }}>
                <p>Loading Kitchen Display...</p>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #3D2610 0%, #5D3A1A 100%)',
            color: 'white',
            padding: '1.5rem'
        }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                padding: '0 0.5rem'
            }}>
                <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <span>👨‍🍳</span>
                    <span>Kitchen Display</span>
                </h1>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-full)'
                }}>
                    <span style={{
                        width: '10px',
                        height: '10px',
                        background: '#4CAF50',
                        borderRadius: '50%',
                        boxShadow: '0 0 10px #4CAF50'
                    }} />
                    <span style={{ fontSize: '0.875rem' }}>Live</span>
                </div>
            </header>

            {/* Columns */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem'
            }}>
                <Column title="New Orders" count={received.length} color="#D97B3D">
                    {received.map(order => (
                        <Ticket
                            key={order.id}
                            order={order}
                            onAction={() => updateStatus(order.id, 'PREPARING')}
                            actionLabel="Start Cooking"
                            actionColor="#D97B3D"
                            isNew={newOrderIds.has(order.id)}
                            onPrintBill={handlePrintBill}
                        />
                    ))}
                </Column>

                <Column title="Cooking" count={preparing.length} color="#FF9800">
                    {preparing.map(order => (
                        <Ticket
                            key={order.id}
                            order={order}
                            onAction={() => updateStatus(order.id, 'READY')}
                            actionLabel="Mark Ready"
                            actionColor="#FF9800"
                            onPrintBill={handlePrintBill}
                        />
                    ))}
                </Column>

                <Column title="Ready to Serve" count={ready.length} color="#4CAF50">
                    {ready.map(order => (
                        <Ticket
                            key={order.id}
                            order={order}
                            onAction={() => updateStatus(order.id, 'COMPLETED')}
                            actionLabel="Complete ✓"
                            actionColor="#4CAF50"
                            onPrintBill={handlePrintBill}
                            onCloseTable={handleCloseTable}
                            showClose
                        />
                    ))}
                </Column>
            </div>

            {/* Active Tables Bar — Always visible, even after all orders are completed */}
            {activeTables.length > 0 && (
                <div style={{
                    marginTop: '2rem',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    border: '1px solid rgba(255,255,255,0.12)'
                }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'rgba(255,255,255,0.9)'
                    }}>
                        🪑 Active Tables ({activeTables.length})
                    </h3>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                    }}>
                        {activeTables.map(t => (
                            <div key={t.sessionId} style={{
                                background: t.allCompleted ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255,255,255,0.1)',
                                border: t.allCompleted ? '1px solid rgba(76, 175, 80, 0.4)' : '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '12px',
                                padding: '0.75rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                minWidth: '220px'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Table {t.tableLabel}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                        {t.orderCount} order{t.orderCount !== 1 ? 's' : ''} • ${t.grandTotal.toFixed(2)}
                                        {t.allCompleted && <span style={{ color: '#4CAF50', fontWeight: 600 }}> ✓ Done</span>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handlePrintBill(t.tableId)}
                                    title="Print Bill"
                                    style={{
                                        width: '38px',
                                        height: '38px',
                                        background: 'rgba(255,255,255,0.15)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '50%',
                                        fontSize: '1.1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    🖨️
                                </button>
                                <button
                                    onClick={() => handleCloseTable(t.tableId, t.tableLabel)}
                                    title="Close Table"
                                    style={{
                                        width: '38px',
                                        height: '38px',
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bill Print Modal */}
            {billData && (
                <BillModal
                    data={billData}
                    onClose={() => setBillData(null)}
                    onCloseTable={() => handleCloseTable(billData.table?.id, billData.table?.label)}
                />
            )}

            <ServiceAlerts />
        </div>
    );
}

function Column({ title, count, children, color }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `3px solid ${color}`,
                paddingBottom: '0.75rem'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</h2>
                <span style={{
                    background: color,
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.875rem',
                    fontWeight: 700
                }}>
                    {count}
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {children}
            </div>
        </div>
    );
}

function Ticket({ order, onAction, actionLabel, actionColor, isNew = false, onPrintBill, onCloseTable, showClose = false }) {
    const elapsed = Math.floor((new Date() - new Date(order.created_at)) / 1000 / 60);

    return (
        <div
            style={{
                background: 'rgba(255,255,255,0.95)',
                color: '#3D2610',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                borderLeft: `5px solid ${actionColor}`,
                boxShadow: isNew ? `0 0 20px ${actionColor}` : '0 4px 20px rgba(0,0,0,0.2)',
                animation: isNew ? 'pulse 1s ease-in-out 3' : 'none'
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
            }}>
                <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                    Table {order.table.label}
                </span>
                <span style={{ fontSize: '0.8125rem', color: '#7A4F2C' }}>
                    #{order.id.slice(0, 4)} • {elapsed}m ago
                </span>
            </div>

            {/* Items */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginBottom: '1rem'
            }}>
                {order.items.map((item, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{
                            background: actionColor,
                            color: 'white',
                            padding: '0.125rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.875rem',
                            fontWeight: 700
                        }}>
                            {item.quantity}x
                        </span>
                        <span style={{ fontWeight: 500 }}>
                            {item.name || item.item?.name}
                        </span>
                    </div>
                ))}
            </div>

            {/* Notes */}
            {order.items.some(i => i.notes) && (
                <div style={{
                    background: '#FFF3E0',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem',
                    fontSize: '0.8125rem'
                }}>
                    📝 {order.items.find(i => i.notes)?.notes}
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={onAction}
                    style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: actionColor,
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {actionLabel}
                </button>
                <button
                    onClick={() => onPrintBill(order.table.id)}
                    title="Print Bill"
                    style={{
                        width: '44px',
                        height: '44px',
                        background: 'rgba(0,0,0,0.05)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    🖨️
                </button>
                {showClose && (
                    <button
                        onClick={() => onCloseTable(order.table.id, order.table.label)}
                        title="Close Table"
                        style={{
                            width: '44px',
                            height: '44px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}

function BillModal({ data, onClose, onCloseTable }) {
    if (!data || !data.orders || data.orders.length === 0) {
        return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'white', color: '#3D2610', padding: '3rem', borderRadius: '20px', textAlign: 'center', maxWidth: '400px' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</p>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Active Orders</h2>
                    <p style={{ color: '#7A4F2C', marginBottom: '2rem' }}>This table has no orders in the current session.</p>
                    <button onClick={onClose} style={{ padding: '0.75rem 2rem', background: '#D97B3D', color: 'white', border: 'none', borderRadius: '999px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
                </div>
            </div>
        );
    }

    // Consolidate items across all session orders
    const consolidatedItems = {};
    let grandTotal = 0;

    data.orders.forEach(order => {
        order.items.forEach(oItem => {
            const key = oItem.item_id || oItem.item?.id;
            const name = oItem.item?.name || oItem.name || 'Item';
            const price = oItem.price;

            if (consolidatedItems[key]) {
                consolidatedItems[key].quantity += oItem.quantity;
            } else {
                consolidatedItems[key] = { name, price, quantity: oItem.quantity };
            }
            grandTotal += price * oItem.quantity;
        });
    });

    const itemsArray = Object.values(consolidatedItems);

    const handlePrint = () => window.print();

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Receipt */}
                <div className="receipt-content" style={{
                    background: 'white',
                    color: 'black',
                    padding: '2.5rem 2rem',
                    fontFamily: "'Courier Prime', 'Courier New', monospace",
                    borderRadius: '12px',
                    position: 'relative'
                }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px dashed #000', paddingBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>
                            The Coffee House
                        </h2>
                        <p style={{ fontSize: '1rem', fontWeight: 600, margin: '0.5rem 0' }}>
                            BILL — TABLE {data.table?.label}
                        </p>
                        <div style={{ fontSize: '0.85rem', color: '#333', marginTop: '0.75rem' }}>
                            <p>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p>Orders: {data.orders.length} | Session: #{data.session?.id?.slice(0, 6) || '—'}</p>
                        </div>
                    </div>

                    {/* Items */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 700 }}>
                            <span>ITEM</span>
                            <span>TOTAL</span>
                        </div>
                        {itemsArray.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                                    <span style={{ fontSize: '0.85rem' }}>{item.quantity} x ${item.price.toFixed(2)}</span>
                                </div>
                                <span style={{ fontWeight: 700, alignSelf: 'flex-end' }}>
                                    ${(item.price * item.quantity).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div style={{ borderTop: '2px dashed #000', paddingTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 800 }}>
                            <span>TOTAL</span>
                            <span>${grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Thank you for visiting!</p>
                        <p style={{ fontSize: '0.75rem', color: '#666' }}>Please present this at the counter.</p>
                    </div>

                    {/* Zigzag edge */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-10px',
                        left: 0,
                        width: '100%',
                        height: '10px',
                        background: 'linear-gradient(-45deg, white 5px, transparent 0), linear-gradient(45deg, white 5px, transparent 0)',
                        backgroundSize: '10px 10px'
                    }} />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={handlePrint}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: '#D97B3D',
                            color: 'white',
                            border: 'none',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        🖨️ Print
                    </button>
                    <button
                        onClick={onCloseTable}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        ✅ Close Table
                    </button>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        padding: '0.75rem',
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.6)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    Cancel
                </button>
            </div>

            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .receipt-content, .receipt-content * { visibility: visible; }
                    .receipt-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        max-width: 100% !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
