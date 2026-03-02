"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useParams } from 'next/navigation';
import { playNotificationSound } from '@/lib/sound';

/**
 * FloatingService is a wrapper that only mounts FloatingServiceContent 
 * if we are currently at a table (tableId present in URL).
 */
export default function FloatingService() {
    const params = useParams();
    const tableId = params?.tableId;

    if (!tableId) return null;

    return <FloatingServiceContent tableId={tableId} />;
}

function FloatingServiceContent({ tableId }) {
    const { showToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('menu'); // 'menu' or 'chat'
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeOrders, setActiveOrders] = useState([]);

    const chatEndRef = useRef(null);
    const hasClearedRef = useRef(false);
    const lastMessageIdRef = useRef(null);

    // Clear chat messages on page load/refresh so new customers don't see old chats
    useEffect(() => {
        if (!hasClearedRef.current) {
            hasClearedRef.current = true;
            fetch(`/api/table/${tableId}/chat`, { method: 'DELETE' }).catch(() => { });
        }
    }, [tableId]);

    // Poll for messages in the background even if the modal is closed
    useEffect(() => {
        fetchMessages(true); // Initial fetch
        fetchOrders(); // Initial orders
        const interval = setInterval(() => {
            fetchMessages(false);
            fetchOrders();
        }, 3000);
        return () => clearInterval(interval);
    }, [tableId]);

    // Clear unread count when chat is viewed
    useEffect(() => {
        if (isOpen && view === 'chat') {
            setUnreadCount(0);
        }
    }, [isOpen, view]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`/api/table/${tableId}/history`);
            if (res.ok) {
                const data = await res.json();
                const currentActive = (data?.orders || []).filter(o => o.status !== 'COMPLETED');
                setActiveOrders(currentActive);
            }
        } catch (e) {
            console.error("Order Fetch Error:", e);
        }
    };

    const fetchMessages = async (isInitial = false) => {
        try {
            const res = await fetch(`/api/table/${tableId}/chat`);
            if (res.ok) {
                const data = await res.json();

                // Detect new staff messages for notification
                if (data.length > 0) {
                    const latestMsg = data[data.length - 1];
                    const isNew = lastMessageIdRef.current && latestMsg.id !== lastMessageIdRef.current;
                    const isFromStaff = latestMsg.sender === 'STAFF';
                    const isChatClosed = !isOpen || view !== 'chat';

                    if (isNew && isFromStaff && isChatClosed) {
                        playNotificationSound();
                        setUnreadCount(prev => prev + 1);
                    }

                    lastMessageIdRef.current = latestMsg.id;
                } else if (isInitial) {
                    lastMessageIdRef.current = null;
                }

                setMessages(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleServiceRequest = async (type, label) => {
        try {
            const res = await fetch(`/api/table/${tableId}/service`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, message: `Request for ${label}` })
            });
            if (res.ok) {
                showToast(`Request for ${label} sent! 🔔`, 'success');
                setIsOpen(false);
            }
        } catch (e) {
            showToast('Failed to call waiter', 'error');
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || isSending) return;

        setIsSending(true);
        try {
            const res = await fetch(`/api/table/${tableId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: inputText, sender: 'CUSTOMER' })
            });
            if (res.ok) {
                setInputText('');
                fetchMessages();
            }
        } catch (e) {
            showToast('Failed to send message', 'error');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '100px', right: '1.5rem', zIndex: 1000 }}>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--brown)',
                    color: 'white',
                    border: '3px solid white',
                    boxShadow: 'var(--shadow-lg)',
                    fontSize: '1.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    transform: isOpen ? 'rotate(90deg)' : 'none'
                }}
            >
                {isOpen ? '✕' : '🔔'}

                {/* Status Badge (if not open and has active orders) */}
                {!isOpen && activeOrders.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '-15px',
                        left: '-40px',
                        background: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        boxShadow: 'var(--shadow-md)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--brown)',
                        whiteSpace: 'nowrap',
                        border: '1px solid var(--border)',
                        animation: 'bounce 2s infinite',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        {activeOrders.some(o => o.status === 'READY') ? '✅ Ready!' : '👨‍🍳 Cooking'}
                    </div>
                )}

                {/* Unread Badge */}
                {!isOpen && unreadCount > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: 'var(--error, #ff4444)',
                        color: 'white',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        animation: 'pulse 2s infinite'
                    }}>
                        {unreadCount}
                    </div>
                )}
            </button>

            {/* Service Modal */}
            {isOpen && (
                <div className="animate-scale-in" style={{
                    position: 'absolute',
                    bottom: '80px',
                    right: 0,
                    width: '320px',
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-2xl)',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '450px'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '1rem',
                        background: 'var(--surface-muted)',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--brown)' }}>
                            {view === 'menu' ? 'Assistant' : 'Chat with Staff'}
                        </h3>
                        {view === 'chat' && (
                            <button
                                onClick={() => setView('menu')}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Back
                            </button>
                        )}
                    </div>

                    {/* Menu View */}
                    {view === 'menu' && (
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <ServiceOption
                                icon="🙋‍♂️" label="Call Waiter"
                                onClick={() => handleServiceRequest('CALL', 'Waiter')}
                            />
                            <ServiceOption
                                icon="💵" label="Request Bill"
                                onClick={() => handleServiceRequest('BILL', 'Bill')}
                            />
                            <ServiceOption
                                icon="💬" label="Chat with Staff"
                                onClick={() => setView('chat')}
                                color="var(--primary)"
                            />
                        </div>
                    )}

                    {/* Chat View */}
                    {view === 'chat' && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '350px' }}>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {messages.length === 0 && (
                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2rem' }}>
                                        No messages yet. Send a message to start chatting!
                                    </p>
                                )}
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        style={{
                                            alignSelf: msg.sender === 'CUSTOMER' ? 'flex-end' : 'flex-start',
                                            background: msg.sender === 'CUSTOMER' ? 'var(--primary)' : 'var(--surface-muted)',
                                            color: msg.sender === 'CUSTOMER' ? 'white' : 'var(--text-primary)',
                                            padding: '0.5rem 0.875rem',
                                            borderRadius: 'var(--radius-lg)',
                                            maxWidth: '80%',
                                            fontSize: '0.9rem',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}
                                    >
                                        {msg.text}
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={sendMessage} style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type a message..."
                                    style={{
                                        flex: 1,
                                        padding: '0.625rem',
                                        borderRadius: 'var(--radius-full)',
                                        border: '1px solid var(--border)',
                                        outline: 'none',
                                        fontSize: '0.9rem'
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim() || isSending}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    ➤
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ServiceOption({ icon, label, onClick, color }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.875rem',
                background: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
            <span style={{ fontSize: '1.25rem' }}>{icon}</span>
            <span style={{ fontWeight: 600, color: color || 'var(--text-primary)', flex: 1 }}>{label}</span>
            <span style={{ color: 'var(--text-muted)' }}>›</span>
        </button>
    );
}
