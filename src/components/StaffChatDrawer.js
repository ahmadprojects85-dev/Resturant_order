"use client";
import React, { useState, useEffect, useRef } from 'react';
import { playNotificationSound } from '@/lib/sound';

export default function StaffChatDrawer({ tableId, tableName, onClose }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatEndRef = useRef(null);
    const lastMessageIdRef = useRef(null);
    const isFirstLoadRef = useRef(true);

    useEffect(() => {
        if (tableId) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [tableId]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/table/${tableId}/chat`);
            if (res.ok) {
                const data = await res.json();

                // Sound notification for new customer messages
                if (data.length > 0) {
                    const latestMsg = data[data.length - 1];
                    const isNew = lastMessageIdRef.current && latestMsg.id !== lastMessageIdRef.current;
                    const isFromCustomer = latestMsg.sender === 'CUSTOMER';

                    if (isNew && isFromCustomer && !isFirstLoadRef.current) {
                        playNotificationSound();
                    }

                    lastMessageIdRef.current = latestMsg.id;
                }

                isFirstLoadRef.current = false;
                setMessages(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleClearChat = async () => {
        if (!confirm('Are you sure you want to clear this chat history?')) return;
        try {
            const res = await fetch(`/api/table/${tableId}/chat`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setMessages([]);
            }
        } catch (e) {
            console.error('Failed to clear chat', e);
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
                body: JSON.stringify({ text: inputText, sender: 'STAFF' })
            });
            if (res.ok) {
                setInputText('');
                fetchMessages();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSending(false);
        }
    };

    if (!tableId) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '350px',
            background: 'white',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.2)',
            zIndex: 3000,
            display: 'flex',
            flexDirection: 'column',
            color: '#333',
            animation: 'slideInRight 0.3s ease'
        }}>
            {/* Header */}
            <div style={{
                padding: '1.25rem',
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8f9fa'
            }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--brown-dark)' }}>Chat - Table {tableName}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>ID: {tableId.slice(0, 8)}</span>
                        <button
                            onClick={handleClearChat}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#d9534f',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                padding: 0,
                                textDecoration: 'underline'
                            }}
                        >
                            Clear Chat
                        </button>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}
                >✕</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            alignSelf: msg.sender === 'STAFF' ? 'flex-end' : 'flex-start',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.sender === 'STAFF' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%'
                        }}
                    >
                        {msg.sender === 'CUSTOMER' && (
                            <span style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.2rem', marginLeft: '0.5rem' }}>
                                Table {tableName}
                            </span>
                        )}
                        <div
                            style={{
                                background: msg.sender === 'STAFF' ? 'var(--primary)' : '#f0f0f0',
                                color: msg.sender === 'STAFF' ? 'white' : '#333',
                                padding: '0.625rem 1rem',
                                borderRadius: '1rem',
                                borderBottomRightRadius: msg.sender === 'STAFF' ? '0.3rem' : '1rem',
                                borderBottomLeftRadius: msg.sender === 'CUSTOMER' ? '0.3rem' : '1rem',
                                fontSize: '0.9rem',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                            }}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} style={{ padding: '1rem', borderTop: '1px solid #eee', display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Reply to table..."
                    style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        borderRadius: '2rem',
                        border: '1px solid #ddd',
                        outline: 'none',
                        fontSize: '0.9rem'
                    }}
                />
                <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    style={{
                        padding: '0 1rem',
                        borderRadius: '2rem',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    Send
                </button>
            </form>
        </div>
    );
}
