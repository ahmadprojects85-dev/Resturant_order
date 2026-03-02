"use client";
import { useState, useEffect } from 'react';
import ServiceAlerts from '@/components/ServiceAlerts';

export default function SalesDashboard() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedHour, setSelectedHour] = useState(null);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, items

    useEffect(() => {
        setSelectedHour(null);
        let isFirst = true;
        async function fetchSales() {
            if (isFirst) setLoading(true);
            try {
                const res = await fetch(`/api/admin/sales?date=${selectedDate}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (isFirst) { setLoading(false); isFirst = false; }
            }
        }
        fetchSales();
        const interval = setInterval(fetchSales, 10000); // Auto-refresh every 10s
        return () => clearInterval(interval);
    }, [selectedDate]);

    const formatCurrency = (amount) => `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const TrendIndicator = ({ value }) => {
        if (!value) return null;
        const isPositive = value > 0;
        const color = isPositive ? 'var(--success)' : 'var(--error)';
        const icon = isPositive ? '↗' : '↘';
        return (
            <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color,
                background: `${color}15`,
                padding: '2px 8px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px'
            }}>
                {icon} {Math.abs(value)}%
            </span>
        );
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--background)',
            color: 'var(--text-primary)',
            padding: '2.5rem 1.5rem',
            fontFamily: 'var(--font-sans)'
        }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

                {/* Header Section */}
                <header style={{
                    marginBottom: '3rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    paddingBottom: '1.5rem',
                    borderBottom: '1px solid #e2e8f0'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem', boxShadow: '0 4px 12px var(--shadow-md)' }}>📈</div>
                            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>Sales Dashboard</h1>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Comprehensive business intelligence and performance tracking</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                style={{
                                    appearance: 'none',
                                    background: 'white',
                                    border: '1px solid var(--border)',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '10px',
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    boxShadow: 'var(--shadow-sm)',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                            />
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Decrypting sales data...</p>
                    </div>
                ) : data ? (
                    <>
                        {/* High-Level Metric Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '3rem'
                        }}>
                            {[
                                { label: 'Total Revenue', value: formatCurrency(data.summary.totalRevenue), trend: data.summary.trends?.revenue, icon: '💰', color: 'var(--primary)' },
                                { label: 'Daily Orders', value: data.summary.totalOrders, trend: data.summary.trends?.orders, icon: '🧾', color: 'var(--success)' },
                                { label: 'Predicted Peak', value: data.summary.predictedPeakHour, subtitle: 'Historical Peak', icon: '📈', color: 'var(--brown-light)' },
                                { label: 'Peak Capacity', value: data.summary.busiestHour, subtitle: 'Busiest Hour Today', icon: '🔥', color: 'var(--error)' }
                            ].map((stat, i) => (
                                <div key={i} style={{
                                    background: 'white',
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: 'var(--border)',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                    cursor: 'default'
                                }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
                                        <div style={{ width: '32px', height: '32px', background: `${stat.color}15`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{stat.icon}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                                        <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{stat.value}</h3>
                                        {stat.trend !== undefined && <TrendIndicator value={stat.trend} />}
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{stat.subtitle || 'vs. previous day'}</p>
                                </div>
                            ))}
                        </div>

                        {/* Advanced Tab Navigation */}
                        <div style={{
                            display: 'inline-flex',
                            background: 'var(--surface-muted)',
                            padding: '4px',
                            borderRadius: '12px',
                            marginBottom: '2.5rem',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: 'var(--border)'
                        }}>
                            {[
                                { id: 'overview', label: 'Overview', icon: '🎯' },
                                { id: 'transactions', label: 'Transactions', icon: '📝' },
                                { id: 'items', label: 'Menu Performance', icon: '🍳' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: activeTab === tab.id ? 'white' : 'transparent',
                                        border: 'none',
                                        borderRadius: '10px',
                                        color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                                        fontWeight: 700,
                                        fontSize: '0.875rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: activeTab === tab.id ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none'
                                    }}
                                >
                                    <span>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div style={{ animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                            {activeTab === 'overview' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                                    {/* SVG Hourly Chart */}
                                    <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Hourly Traffic Density</h2>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Real-time Distribution</span>
                                        </div>

                                        <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                                            {/* Y-Axis Labels */}
                                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, paddingRight: '8px', zIndex: 1 }}>
                                                {[50, 40, 30, 20, 10, 0].map(val => <div key={val}>{val}</div>)}
                                            </div>

                                            {/* Gridlines & Bars */}
                                            <div style={{ marginLeft: '30px', height: '100%', position: 'relative', borderLeft: '1px solid #f1f5f9', borderBottom: '1px solid var(--border)' }}>
                                                {/* Gridlines */}
                                                {[50, 40, 30, 20, 10].map(val => (
                                                    <div key={val} style={{ position: 'absolute', bottom: `${val * 2}%`, left: 0, right: 0, height: '1px', background: '#f8fafc' }} />
                                                ))}

                                                <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', gap: '6px', padding: '0 8px' }}>
                                                    {(() => {
                                                        // Pre-compute hourly counts to find the actual max
                                                        const hourlyCounts = Array.from({ length: 24 }).map((_, i) => {
                                                            const hOrders = data.orders.filter(o => new Date(o.time).getHours() === i);
                                                            return { hour: i, orders: hOrders, count: hOrders.length, completed: hOrders.filter(o => o.status === 'COMPLETED').length };
                                                        });
                                                        const maxCount = Math.max(...hourlyCounts.map(h => h.count), 1); // Use actual peak, minimum 1 to avoid division by zero

                                                        return hourlyCounts.map(({ hour: i, count, completed }) => {
                                                            const height = (count / maxCount) * 100;
                                                            const compHeight = (completed / (count || 1)) * 100;

                                                            return (
                                                                <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}>
                                                                    <div style={{ width: '100%', height: count > 0 ? `${Math.max(3, height)}%` : '0%', background: 'var(--surface-muted)', borderRadius: '4px 4px 0 0', overflow: 'hidden', transition: 'all 0.3s ease', cursor: count > 0 ? 'help' : 'default', position: 'relative' }} title={`${count} orders at ${i % 12 || 12}${i < 12 ? 'am' : 'pm'}`}>
                                                                        <div style={{ width: '100%', height: `${compHeight}%`, background: 'var(--primary)', position: 'absolute', bottom: 0 }} />
                                                                    </div>
                                                                    <span style={{ position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, opacity: i % 4 === 0 ? 1 : 0 }}>{i}h</span>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category Engagement */}
                                    <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2rem' }}>Menu Area Contribution</h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                                            {data.categories.map((cat, idx) => {
                                                const percentage = Math.round((cat.revenue / data.summary.totalRevenue) * 100);
                                                const colors = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--error)', 'var(--brown-light)'];
                                                const color = colors[idx % colors.length];
                                                return (
                                                    <div key={cat.id}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                                            <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.925rem' }}>{cat.name}</span>
                                                            <span style={{ color: color, fontWeight: 800, fontSize: '0.925rem' }}>{formatCurrency(cat.revenue)} <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginLeft: '4px' }}>• {percentage}%</span></span>
                                                        </div>
                                                        <div style={{ height: '10px', background: 'var(--surface-muted)', borderRadius: '5px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${percentage}%`, height: '100%', background: color, borderRadius: '5px', transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Top Performing Tables */}
                                    <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Top Revenue Centers</h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {(data.summary.topTables || []).length > 0 ? (
                                                data.summary.topTables.map((table, idx) => (
                                                    <div key={idx} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '1rem',
                                                        padding: '1rem',
                                                        background: idx === 0 ? 'rgba(217, 123, 61, 0.05)' : 'var(--surface-muted)',
                                                        borderRadius: '12px',
                                                        border: idx === 0 ? '1px solid var(--primary)' : '1px solid transparent',
                                                        transition: 'transform 0.2s ease'
                                                    }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            background: idx === 0 ? 'var(--primary)' : 'var(--brown)',
                                                            color: 'white',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 800,
                                                            fontSize: '0.875rem'
                                                        }}>{idx + 1}</div>
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Table {table.label}</p>
                                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Revenue Multiplier</p>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <p style={{ fontWeight: 800, color: 'var(--primary)', margin: 0 }}>{formatCurrency(table.revenue)}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '2rem' }}>Awaiting initial revenue data...</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'transactions' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                                    {/* Timeline with hover states */}
                                    <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Order Timeline</h2>
                                        <div className="scroll-hide" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '700px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                            {data.orders.map((order) => {
                                                const isEx = expandedOrder === order.id;
                                                return (
                                                    <div key={order.id} onClick={() => setExpandedOrder(isEx ? null : order.id)} style={{
                                                        padding: '1.25rem',
                                                        background: isEx ? '#f8fafc' : 'white',
                                                        borderRadius: '14px',
                                                        borderWidth: '1px',
                                                        borderStyle: 'solid',
                                                        borderColor: isEx ? 'var(--primary)' : 'var(--border)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                                <div style={{ width: '40px', height: '40px', background: 'var(--background)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary)' }}>{order.table}</div>
                                                                <div>
                                                                    <p style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem', margin: 0 }}>ORD-{order.shortId}</p>
                                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{formatTime(order.time)} • {order.itemCount} items</p>
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <p style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem', margin: 0 }}>{formatCurrency(order.total)}</p>
                                                                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: order.status === 'COMPLETED' ? 'var(--success-bg)' : 'var(--warning-bg)', color: order.status === 'COMPLETED' ? 'var(--success)' : 'var(--warning)', textTransform: 'uppercase' }}>{order.status}</span>
                                                            </div>
                                                        </div>
                                                        {isEx && (
                                                            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '2px dashed #f1f5f9', animation: 'fadeIn 0.2s' }}>
                                                                {order.items.map((item, idx) => (
                                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: '#475569' }}>
                                                                        <span><span style={{ fontWeight: 800, color: '#4f46e5' }}>{item.quantity}×</span> {item.name}</span>
                                                                        <span style={{ fontWeight: 600 }}>{formatCurrency(item.price * item.quantity)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Success Probability Meter */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        <div style={{ background: 'var(--brown-dark)', padding: '2rem', borderRadius: '20px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', opacity: 0.8 }}>Operational Success</h3>
                                            <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>{Math.round((data.summary.completedOrders / data.summary.totalOrders) * 100) || 0}%</div>
                                            <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Orders reaching 'Completed' status today</p>
                                        </div>

                                        <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Hourly breakdown</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {Array.from({ length: 24 }).map((_, i) => {
                                                    const hOrders = data.orders.filter(o => new Date(o.time).getHours() === i);
                                                    if (hOrders.length === 0) return null;
                                                    const rev = hOrders.reduce((sum, o) => sum + o.total, 0);
                                                    return (
                                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--surface-hover)', borderRadius: '10px' }}>
                                                            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{i % 12 || 12}{i < 12 ? 'am' : 'pm'}</span>
                                                            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(rev)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'items' && (
                                <div style={{ background: 'white', borderRadius: '20px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                                    <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Product Performance Audit</h2>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <span style={{ padding: '4px 12px', background: 'var(--surface-muted)', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{data.items.length} items sold</span>
                                        </div>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                                                    <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Menu Item</th>
                                                    <th style={{ padding: '1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Classification</th>
                                                    <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Units</th>
                                                    <th style={{ padding: '1.25rem 2rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Financial Impact</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.items.map((item, idx) => (
                                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                        <td style={{ padding: '1.25rem 2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</td>
                                                        <td style={{ padding: '1.25rem' }}>
                                                            <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'var(--surface-muted)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '20px' }}>{item.category}</span>
                                                        </td>
                                                        <td style={{ padding: '1.25rem', textAlign: 'center', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                            {item.quantity}
                                                        </td>
                                                        <td style={{ padding: '1.25rem 2rem', textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>{formatCurrency(item.revenue)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '5rem', background: 'white', borderRadius: '24px', border: '2px dashed var(--border)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔦</div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Data Signal</h3>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', margin: '0 auto' }}>We couldn't find any financial activity on this date. Try switching to another date.</p>
                    </div>
                )}
            </div>
            <ServiceAlerts />
        </div>
    );
}
