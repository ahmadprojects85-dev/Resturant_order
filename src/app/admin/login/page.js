"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                // Determine redirect based on role or just go to sales
                router.push('/admin/sales');
            } else {
                setError(data.error || 'Invalid username or password');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-icon">☕</div>
                    <h1>Staff Portal</h1>
                    <p>Enter credentials to access dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g. admin"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>© 2026 The Coffee House • Internal Use Only</p>
                </div>
            </div>

            <style jsx>{`
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #0f0f0f;
                    background-image: 
                        radial-gradient(circle at 20% 20%, rgba(196, 96, 42, 0.15) 0%, transparent 40%),
                        radial-gradient(circle at 80% 80%, rgba(61, 38, 16, 0.3) 0%, transparent 40%);
                    padding: 20px;
                    font-family: 'Inter', sans-serif;
                }

                .login-card {
                    background: rgba(30, 30, 30, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 40px;
                    border-radius: 32px;
                    width: 100%;
                    max-width: 400px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .logo-icon {
                    font-size: 40px;
                    margin-bottom: 16px;
                    display: inline-block;
                    filter: drop-shadow(0 0 10px rgba(196, 96, 42, 0.5));
                }

                .login-header h1 {
                    color: white;
                    font-size: 24px;
                    font-weight: 800;
                    margin-bottom: 8px;
                    letter-spacing: -0.5px;
                }

                .login-header p {
                    color: #a0a0a0;
                    font-size: 14px;
                }

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .input-group label {
                    color: #d0d0d0;
                    font-size: 14px;
                    font-weight: 500;
                    margin-left: 4px;
                }

                .input-group input {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 14px 16px;
                    border-radius: 12px;
                    color: white;
                    font-size: 16px;
                    transition: all 0.2s ease;
                }

                .input-group input:focus {
                    outline: none;
                    border-color: #c4602a;
                    background: rgba(255, 255, 255, 0.08);
                    box-shadow: 0 0 0 4px rgba(196, 96, 42, 0.15);
                }

                .error-message {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #f87171;
                    padding: 12px;
                    border-radius: 10px;
                    font-size: 14px;
                    text-align: center;
                }

                .login-button {
                    background: #c4602a;
                    color: white;
                    border: none;
                    padding: 14px;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-top: 10px;
                }

                .login-button:hover:not(:disabled) {
                    background: #d46d36;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(196, 96, 42, 0.4);
                }

                .login-button:active:not(:disabled) {
                    transform: translateY(0);
                }

                .login-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .login-footer {
                    margin-top: 32px;
                    text-align: center;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    padding-top: 24px;
                }

                .login-footer p {
                    color: #606060;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
            `}</style>
        </div>
    );
}
