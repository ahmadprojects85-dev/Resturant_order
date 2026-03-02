"use client";
import React, { useState, useEffect, useRef } from 'react';
import { playRingSound } from '@/lib/sound';
import StaffChatDrawer from './StaffChatDrawer';

export default function ServiceAlerts() {
    const [requests, setRequests] = useState([]);
    const [activeAlert, setActiveAlert] = useState(null);
    const [activeChat, setActiveChat] = useState(null); // { id: tableId, name: tableName }
    const knownRequestIds = useRef(new Set());
    const isFirstLoad = useRef(true);

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/admin/service');
            if (!res.ok) {
                console.warn("Service API Error:", res.statusText);
                return;
            }

            const data = await res.json();
            if (!Array.isArray(data)) {
                console.error("Invalid Service Data:", data);
                return;
            }

            // Identify new requests for ring notification
            const newRequests = data.filter(r => !knownRequestIds.current.has(r.id));
            if (newRequests.length > 0 && !isFirstLoad.current) {
                playRingSound();
                setActiveAlert(newRequests[newRequests.length - 1]);
            }

            data.forEach(r => knownRequestIds.current.add(r.id));
            setRequests(data);
            isFirstLoad.current = false;
        } catch (e) {
            console.warn("Service Request Polling Error:", e.message);
        }
    };

    const handleDone = async (requestId) => {
        try {
            const res = await fetch('/api/admin/service', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, status: 'DONE' })
            });
            if (res.ok) {
                setRequests(prev => prev.filter(r => r.id !== requestId));
                if (activeAlert?.id === requestId) setActiveAlert(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (requests.length === 0 && !activeAlert && !activeChat) return null;

    return (
        <>
            {/* Urgent Overlay Alert */}
            {activeAlert && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div className="animate-scale-in" style={{
                        background: 'var(--surface)',
                        padding: '3rem',
                        borderRadius: 'var(--radius-3xl)',
                        textAlign: 'center',
                        maxWidth: '400px',
                        border: '4px solid var(--primary)',
                        boxShadow: '0 0 50px rgba(217, 123, 61, 0.5)'
                    }}>
                        <div style={{ fontSize: '5rem', marginBottom: '1.5rem', animation: 'pulse 1s infinite' }}>🔔</div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brown)', marginBottom: '0.5rem' }}>
                            Table {activeAlert.table.label}
                        </h2>
                        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            is calling for {activeAlert.type}!
                        </p>
                        {activeAlert.message && (
                            <div style={{
                                background: 'var(--surface-muted)',
                                padding: '1rem',
                                borderRadius: 'var(--radius-lg)',
                                marginBottom: '2rem',
                                fontStyle: 'italic',
                                borderLeft: '4px solid var(--primary)',
                                textAlign: 'left',
                                color: 'var(--brown)',
                                fontWeight: 500
                            }}>
                                "{activeAlert.message}"
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                onClick={() => handleDone(activeAlert.id)}
                                style={{
                                    width: '100%',
                                    padding: '1.25rem',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-full)',
                                    fontWeight: 700,
                                    fontSize: '1.125rem',
                                    cursor: 'pointer',
                                    boxShadow: 'var(--shadow-md)'
                                }}
                            >
                                I'M GOING!
                            </button>
                            {activeAlert.type !== 'BILL' && (
                                <button
                                    onClick={() => {
                                        setActiveChat({ id: activeAlert.table_id, name: activeAlert.table.label });
                                        setActiveAlert(null);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        background: 'var(--surface-muted)',
                                        color: 'var(--brown)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-full)',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    💬 Open Chat
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setActiveAlert(null)}
                            style={{
                                width: '100%',
                                marginTop: '1rem',
                                padding: '0.75rem',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Side Panel for All Pending Requests */}
            <div style={{
                position: 'fixed',
                top: '100px',
                right: '1.5rem',
                width: '300px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                {requests.map(req => (
                    <div key={req.id} className="animate-slide-in-right" style={{
                        background: 'rgba(255,255,255,0.95)',
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--radius-xl)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        borderLeft: '6px solid var(--primary)',
                        color: '#3D2610'
                    }}>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
                                Table {req.table.label}
                            </p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>
                                {req.type === 'CHAT' ? '💬 Message' : req.type}
                            </p>
                            {req.message && (
                                <p style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-muted)',
                                    margin: '0.25rem 0 0 0',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '180px'
                                }}>
                                    "{req.message}"
                                </p>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {req.type !== 'BILL' && (
                                <button
                                    onClick={() => setActiveChat({ id: req.table_id, name: req.table.label })}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'var(--surface-muted)',
                                        color: 'var(--brown)',
                                        border: '1px solid var(--border)',
                                        fontSize: '1.1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    💬
                                </button>
                            )}
                            <button
                                onClick={() => handleDone(req.id)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'var(--success)',
                                    color: 'white',
                                    border: 'none',
                                    fontSize: '1.25rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ✓
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Global Staff Chat Drawer */}
            {activeChat && (
                <StaffChatDrawer
                    tableId={activeChat.id}
                    tableName={activeChat.name}
                    onClose={() => setActiveChat(null)}
                />
            )}
        </>
    );
}
