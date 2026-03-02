"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import ConsolidatedReceipt from '@/components/ConsolidatedReceipt';

export default function BillPage() {
    const params = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReceipt, setShowReceipt] = useState(false);
    const { showToast } = useToast();

    // Fetch with polling for real-time updates
    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [params.tableId]);

    async function fetchHistory() {
        try {
            const res = await fetch(`/api/table/${params.tableId}/history`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error(e);
            if (!data) showToast("Failed to load bill history", "error");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'var(--background)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div className="animate-pulse" style={{ fontSize: '2rem' }}>☕</div>
            </div>
        );
    }

    if (!data || data.orders.length === 0) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'var(--background)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📋</div>
                <h2 className="text-heading" style={{ marginBottom: '0.5rem' }}>No Orders Yet</h2>
                <p className="text-secondary" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    You haven't placed any orders for Table {params.tableId} yet.
                </p>
                <Link
                    href={`/r/${params.slug}/t/${params.tableId}`}
                    className="btn btn-primary"
                >
                    Browse Menu
                </Link>
            </div>
        );
    }

    const grandTotal = data.orders.reduce((sum, order) => sum + order.total_price, 0);
    const activeOrders = data.orders.filter(o => o.status !== 'COMPLETED');
    const completedOrders = data.orders.filter(o => o.status === 'COMPLETED');

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)', paddingBottom: '100px' }}>

            {/* Header */}
            <header style={{
                padding: '1.5rem 1rem',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <Link
                        href={`/r/${params.slug}/t/${params.tableId}`}
                        className="text-small"
                        style={{
                            color: 'var(--primary)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            marginBottom: '0.75rem'
                        }}
                    >
                        ← Back to Menu
                    </Link>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 className="text-heading" style={{ color: 'var(--brown)' }}>Your Bill</h1>
                            <p className="text-small text-secondary">Table {data.label}</p>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            <button
                                onClick={() => setShowReceipt(!showReceipt)}
                                className="btn"
                                style={{
                                    background: showReceipt ? 'var(--surface-muted)' : 'var(--brown)',
                                    color: showReceipt ? 'var(--brown)' : 'white',
                                    padding: '0.625rem 1.25rem',
                                    borderRadius: 'var(--radius-full)',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                            >
                                {showReceipt ? '📋 View Summary' : '🖨️ Print Bill'}
                            </button>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: 'var(--surface-muted)',
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-full)'
                            }}>
                                <span className="status-dot"></span>
                                <span className="text-small">Live</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem 1rem' }}>

                {showReceipt ? (
                    <div className="animate-scale-in">
                        <ConsolidatedReceipt data={data} />
                        <button
                            onClick={() => setShowReceipt(false)}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                marginTop: '2rem',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Back to detailed view
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Total Summary */}
                        <div className="card" style={{
                            padding: '2rem',
                            marginBottom: '2rem',
                            textAlign: 'center',
                            background: 'var(--surface)'
                        }}>
                            <p className="text-caption text-muted" style={{ marginBottom: '0.5rem' }}>
                                Total Amount
                            </p>
                            <div style={{
                                fontSize: '3rem',
                                fontWeight: 700,
                                color: 'var(--primary)',
                                lineHeight: 1
                            }}>
                                ${grandTotal.toFixed(2)}
                            </div>
                            <p className="text-small text-secondary" style={{ marginTop: '0.75rem' }}>
                                {data.orders.length} {data.orders.length === 1 ? 'Order' : 'Orders'}
                            </p>
                        </div>

                        {/* Active Orders */}
                        {activeOrders.length > 0 && (
                            <>
                                <h2 className="text-title" style={{
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span className="status-dot preparing"></span>
                                    Active Orders
                                </h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                    {activeOrders.map(order => (
                                        <OrderCard key={order.id} order={order} />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Completed Orders */}
                        {completedOrders.length > 0 && (
                            <>
                                <h2 className="text-title" style={{
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    ✓ Completed Orders
                                </h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {completedOrders.map(order => (
                                        <OrderCard key={order.id} order={order} isCompleted />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Pay at Counter Notice */}
                        <div style={{
                            marginTop: '2rem',
                            padding: '1.25rem',
                            background: 'rgba(217, 123, 61, 0.1)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--primary)',
                            textAlign: 'center'
                        }}>
                            <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--brown)', marginBottom: '0.25rem' }}>
                                💵 Pay at Counter
                            </p>
                            <p className="text-small text-secondary">
                                Please pay your bill at the counter when ready to leave.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function OrderCard({ order, isCompleted = false }) {
    const statusConfig = {
        'RECEIVED': { label: 'Order Received', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: '📋' },
        'PREPARING': { label: 'Preparing', color: 'var(--warning)', bg: 'var(--warning-bg)', icon: '👨‍🍳' },
        'READY': { label: 'Ready!', color: 'var(--success)', bg: 'var(--success-bg)', icon: '✅' },
        'COMPLETED': { label: 'Completed', color: 'var(--text-muted)', bg: 'var(--surface-muted)', icon: '✓' }
    };

    const status = statusConfig[order.status] || statusConfig['RECEIVED'];

    return (
        <div className="card" style={{
            padding: '1.25rem',
            opacity: isCompleted ? 0.7 : 1
        }}>
            {/* Order Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
            }}>
                <div>
                    <span className="text-small text-muted">
                        Order #{order.id.slice(0, 4).toUpperCase()}
                    </span>
                    <p className="text-caption text-muted" style={{ marginTop: '0.25rem' }}>
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {/* Status Badge */}
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        background: status.bg,
                        color: status.color,
                        padding: '0.375rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8125rem',
                        fontWeight: 600
                    }}>
                        <span>{status.icon}</span>
                        <span>{status.label}</span>
                    </span>
                </div>
            </div>

            {/* Items List */}
            <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
            }}>
                {order.items.map(oItem => (
                    <div key={oItem.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '24px',
                                height: '24px',
                                background: 'var(--surface-muted)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                marginRight: '0.5rem'
                            }}>
                                {oItem.quantity}
                            </span>
                            {oItem.item.name}
                        </span>
                        <span className="text-muted">
                            ${(oItem.price * oItem.quantity).toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Order Total */}
            <div style={{
                borderTop: '1px solid var(--border)',
                marginTop: '1rem',
                paddingTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span className="text-small" style={{ fontWeight: 600 }}>Order Total</span>
                <span className="price" style={{ fontSize: '1.125rem' }}>
                    ${order.total_price.toFixed(2)}
                </span>
            </div>
        </div>
    );
}
