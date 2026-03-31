"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Completely bypass login
    const handleBypass = async () => {
        setLoading(true);
        try {
            // We still hit the API so it sets the cookie properly
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'ahmad', password: '1234' }), // 100% hardcoded bypass
            });

            if (res.ok) {
                router.push('/admin/sales');
            } else {
                // If it somehow fails, force redirect anyway since middleware is disabled
                router.push('/admin/sales');
            }
        } catch (err) {
            router.push('/admin/sales');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f0f0f',
            backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(196, 96, 42, 0.15) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(61, 38, 16, 0.3) 0%, transparent 40%)',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                background: 'rgba(30, 30, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                padding: '50px',
                borderRadius: '32px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <div style={{ fontSize: '50px', marginBottom: '20px' }}>☕</div>
                <h1 style={{ color: 'white', marginBottom: '30px', fontSize: '28px' }}>Security Disabled</h1>
                <button 
                    onClick={handleBypass}
                    disabled={loading}
                    style={{
                        background: '#c4602a',
                        color: 'white',
                        border: 'none',
                        padding: '16px 32px',
                        borderRadius: '16px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        width: '100%',
                        boxShadow: '0 10px 20px rgba(196, 96, 42, 0.3)'
                    }}
                >
                    {loading ? 'Entering Dashboard...' : 'Enter Dashboard'}
                </button>
                
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#a0a0a0',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}>
                      ✨ Developed by 
                      <a 
                        href="https://www.instagram.com/ahmad.a.qaradaghi?igsh=MXB6NGl5Ymp5bjBlYw==" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          color: '#c4602a',
                          fontWeight: '800',
                          textDecoration: 'none',
                          padding: '4px 10px',
                          background: 'rgba(196, 96, 42, 0.15)',
                          borderRadius: '20px',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                       Ahmad Amjad
                      </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
