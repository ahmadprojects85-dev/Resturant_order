"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                router.push('/admin/sales');
            } else {
                setError('Invalid password');
            }
        } catch (err) {
            setError('Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--background)',
            padding: '1rem'
        }}>
            <div className="card card-glass animate-scale-in" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'var(--surface-muted)',
                        borderRadius: 'var(--radius-full)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem',
                        fontSize: '2.5rem'
                    }}>
                        ☕
                    </div>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: 'var(--brown)',
                        marginBottom: '0.5rem'
                    }}>
                        Admin Access
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Please enter your password
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            style={{
                                textAlign: 'center',
                                fontSize: '1.125rem',
                                letterSpacing: '0.1em'
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            background: 'var(--error-bg)',
                            color: 'var(--error)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            textAlign: 'center',
                            fontWeight: 500
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary btn-lg btn-full"
                    >
                        {loading ? 'Verifying...' : 'Unlock Dashboard'}
                    </button>
                </form>

                {/* Footer */}
                <p style={{
                    textAlign: 'center',
                    marginTop: '1.5rem',
                    fontSize: '0.8125rem',
                    color: 'var(--text-muted)'
                }}>
                    Contact your manager if you forgot the password
                </p>
            </div>
        </div>
    );
}
