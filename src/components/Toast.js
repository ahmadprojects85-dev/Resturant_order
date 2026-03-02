"use client";
import { useEffect } from 'react';

export default function Toast({ id, message, type = 'info', duration = 3000, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const colors = {
        success: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#10b981' },
        error: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#ef4444' },
        warning: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#f59e0b' },
        info: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#3b82f6' }
    };

    const style = colors[type] || colors.info;

    return (
        <div
            className="toast-item animate-slide-in-right"
            style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                minWidth: '300px',
                maxWidth: '400px',
                boxShadow: 'var(--shadow-lg)',
                backdropFilter: 'blur(10px)',
                animation: 'slideInRight 0.3s ease-out'
            }}
        >
            <div
                style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: style.text,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                }}
            >
                {icons[type]}
            </div>
            <p style={{ flex: 1, margin: 0, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                {message}
            </p>
            <button
                onClick={() => onClose(id)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    padding: '0',
                    lineHeight: 1,
                    transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
            >
                ×
            </button>
        </div>
    );
}

export function ToastContainer({ toasts, onClose }) {
    return (
        <div
            style={{
                position: 'fixed',
                top: '1rem',
                right: '1rem',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                pointerEvents: 'none'
            }}
        >
            {toasts.map((toast) => (
                <div key={toast.id} style={{ pointerEvents: 'auto' }}>
                    <Toast {...toast} onClose={onClose} />
                </div>
            ))}
        </div>
    );
}
