"use client";
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { playRingSound } from '@/lib/sound';

const NotificationContext = createContext(null);

export function useNotifications() {
    return useContext(NotificationContext);
}

// Converts the base64 VAPID public key to a Uint8Array for the browser API
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export function NotificationProvider({ children }) {
    const [permission, setPermission] = useState('default');
    const [isSupported, setIsSupported] = useState(false);
    const [swRegistration, setSwRegistration] = useState(null);
    const [readyOrderIds, setReadyOrderIds] = useState(new Set());
    const [showBanner, setShowBanner] = useState(false);
    const [bannerMessage, setBannerMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const pollingRef = useRef(null);
    const trackedOrdersRef = useRef(new Set()); // orders we are tracking for status

    // We must unlock the AudioContext on first user interaction so it can ring later
    const audioContextRef = useRef(null);
    const unlockAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                audioContextRef.current = new AudioCtx();

                // Play a brief silent tone to unlock
                const oscillator = audioContextRef.current.createOscillator();
                const gainNode = audioContextRef.current.createGain();
                gainNode.gain.value = 0;
                oscillator.connect(gainNode);
                gainNode.connect(audioContextRef.current.destination);
                oscillator.start(0);
                oscillator.stop(0.01);

                console.log("[Audio] Web API unlocked successfully on user gesture.");
            } catch (e) {
                console.warn("[Audio] Failed to unlock audio context:", e);
            }
        }

        // Ensure it's resumed if suspended
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
    }, []);

    // Automatically unlock audio context on the first interaction anywhere on the page
    useEffect(() => {
        const handleInteraction = () => {
            unlockAudioContext();
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
        };
        document.addEventListener('click', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);
        return () => {
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
        };
    }, [unlockAudioContext]);

    // On mount: check support and register service worker
    useEffect(() => {
        const supported = typeof window !== 'undefined'
            && 'serviceWorker' in navigator
            && 'PushManager' in window;
        setIsSupported(supported);
        if (!supported) return;

        setPermission(Notification.permission);

        navigator.serviceWorker.register('/sw.js')
            .then((reg) => {
                // Force an update to ensure we have the latest SW code
                reg.update();
                setSwRegistration(reg);
            })
            .catch(err => console.warn('SW registration failed:', err));
    }, []);

    // Show an in-app banner when an order becomes ready
    const showReadyBanner = useCallback((message) => {
        setBannerMessage(message);
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 8000);
    }, []);

    // Poll order status for tracked orders to show in-app banner
    useEffect(() => {
        if (trackedOrdersRef.current.size === 0) return;

        async function checkOrders() {
            for (const orderId of trackedOrdersRef.current) {
                if (readyOrderIds.has(orderId)) continue; // already notified
                try {
                    const res = await fetch(`/api/orders/${orderId}`);
                    if (!res.ok) continue;
                    const order = await res.json();
                    if (order.status === 'READY') {
                        setReadyOrderIds(prev => new Set([...prev, orderId]));
                        const shortId = orderId.slice(0, 6).toUpperCase();

                        // 1. Show the nice green banner
                        showReadyBanner(`🍽️ Your order #${shortId} is ready! Come pick it up.`);

                        // 2. Trigger aggressive in-app modal instead of browser alert
                        setModalMessage(`Your order #${shortId} is hot and ready to serve!\n\nPlease come to the counter to pick it up.`);
                        setShowModal(true);

                        // 3. Play loud ringing sound on the customer's phone
                        try {
                            if (audioContextRef.current) {
                                // If suspended, resume it first
                                if (audioContextRef.current.state === 'suspended') {
                                    audioContextRef.current.resume();
                                }
                                playRingSound(audioContextRef.current);
                            } else {
                                // Fallback if they somehow bypassed the unlock
                                playRingSound();
                            }
                        } catch (err) {
                            console.warn("Could not play ring sound:", err);
                        }
                    }
                } catch (e) { /* silent */ }
            }
        }

        pollingRef.current = setInterval(checkOrders, 2000); // Check every 2 seconds
        checkOrders(); // Also check immediately

        return () => clearInterval(pollingRef.current);
    }, [showReadyBanner, readyOrderIds]);

    // Explicitly ask for permission (MUST be called synchronously from an onClick handler)
    const askForPermission = useCallback(async () => {
        // Unlock audio context on this click!
        unlockAudioContext();

        if (!isSupported) return false;
        try {
            const perm = await Notification.requestPermission();
            setPermission(perm);
            return perm === 'granted';
        } catch (err) {
            console.warn('Failed to request permission:', err);
            return false;
        }
    }, [isSupported, unlockAudioContext]);

    // Subscribe to push notifications for a specific order
    const subscribeForOrder = useCallback(async (orderId) => {
        // Double-check audio is unlocked just in case
        unlockAudioContext();

        // Track this order for in-app polling regardless
        trackedOrdersRef.current.add(orderId);

        if (!isSupported) return;

        try {
            // Re-check permission (assuming askForPermission was already called during checkout)
            if (Notification.permission !== 'granted') {
                console.info('Push notification permission denied — in-app polling still active.');
                return;
            }

            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidKey) {
                console.warn('VAPID public key not configured');
                return;
            }

            try {
                console.log(`[Push] Starting subscription sequence for order ${orderId}`);

                // Wait until service worker is fully ready
                console.log('[Push] Waiting for service worker readiness...');
                const registration = await navigator.serviceWorker.ready;
                console.log('[Push] Service worker is ready. Current state:', registration.active?.state);

                // Get existing subscription or create a new one
                let subscription = await registration.pushManager.getSubscription();

                if (subscription) {
                    console.log('[Push] Found existing subscription.', subscription.endpoint);
                } else {
                    console.log('[Push] No existing subscription. Requesting new one from PushManager...');
                    try {
                        subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(vapidKey)
                        });
                        console.log('[Push] Successfully obtained new PushManager subscription!', subscription.endpoint);
                    } catch (pushErr) {
                        if (pushErr.name === 'AbortError') {
                            console.info('[Push] Push service temporarily unavailable. Using polling as fallback.');
                        } else {
                            console.warn('[Push] Push subscription failed:', pushErr.name, pushErr.message);
                        }
                        return; // Stop here, polling is already active
                    }
                }

                // Save subscription to server, linked to this order
                console.log('[Push] Sending subscription to backend /api/push/subscribe...');
                const res = await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscription: subscription.toJSON(), orderId })
                });

                if (!res.ok) {
                    const text = await res.text();
                    console.error('[Push] Server rejected subscription:', res.status, text);
                } else {
                    console.log('[Push] ✅ Push subscription saved to database for order', orderId);
                }

            } catch (err) {
                console.error('[Push] Unexpected failure during push subscription:', err);
            }
        } catch (err) {
            console.error('[Push] Unexpected failure during push subscription:', err);
        }
    }, [isSupported]);

    return (
        <NotificationContext.Provider value={{ subscribeForOrder, askForPermission, permission, isSupported }}>
            {children}

            {/* In-app Ready Banner */}
            {showBanner && (
                <div
                    style={{
                        position: 'fixed',
                        top: '16px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 9999,
                        background: 'linear-gradient(135deg, #4CAF50, #2e7d32)',
                        color: 'white',
                        padding: '1rem 1.5rem',
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(76,175,80,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        maxWidth: 'calc(100vw - 2rem)',
                        animation: 'slideDownBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                    onClick={() => setShowBanner(false)}
                >
                    <span style={{ fontSize: '1.5rem' }}>🍽️</span>
                    <span>{bannerMessage}</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.7, fontSize: '0.875rem' }}>✕</span>
                </div>
            )}

            {/* Native-like Alert Modal - Redesigned to match premium aesthetic */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(61, 38, 16, 0.4)', // Warm overlay
                    zIndex: 10000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    padding: '1.5rem'
                }}>
                    <div className="animate-scale-in" style={{
                        background: 'var(--surface)',
                        padding: '3rem 2rem 2.5rem',
                        borderRadius: '32px',
                        maxWidth: '420px',
                        width: '100%',
                        boxShadow: '0 30px 60px rgba(61, 38, 16, 0.25)',
                        textAlign: 'center',
                        position: 'relative',
                        border: '1px solid rgba(217, 123, 61, 0.2)',
                        overflow: 'hidden'
                    }}>
                        {/* Glow Effect */}
                        <div style={{
                            position: 'absolute',
                            top: '-50px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '200px',
                            height: '200px',
                            background: 'var(--primary-glow)',
                            filter: 'blur(50px)',
                            borderRadius: '50%',
                            opacity: 0.5,
                            zIndex: 0
                        }}></div>

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            {/* 3D Bell Icon/Emoji */}
                            <div style={{
                                fontSize: '5rem',
                                marginBottom: '1.5rem',
                                filter: 'drop-shadow(0 10px 15px rgba(217, 123, 61, 0.3))',
                                animation: 'bellShake 1.5s ease-in-out infinite'
                            }}>
                                🔔
                            </div>

                            <h2 style={{
                                fontSize: 'var(--text-h1)',
                                fontWeight: 800,
                                color: 'var(--brown)',
                                marginBottom: '0.5rem',
                                fontFamily: 'var(--font-display)',
                                letterSpacing: '-0.03em'
                            }}>
                                {modalMessage.split('\n')[0].replace('Your order', '').split('is')[0].trim() || 'Ready!'}
                            </h2>

                            <p style={{
                                color: 'var(--text-secondary)',
                                fontSize: 'var(--text-h3)',
                                fontWeight: 600,
                                fontFamily: 'var(--font-display)',
                                letterSpacing: '-0.01em',
                                marginBottom: '1.5rem'
                            }}>
                                is READY to serve!
                            </p>

                            {/* Details Box */}
                            <div style={{
                                background: 'var(--surface-muted)',
                                padding: '1.25rem',
                                borderRadius: '20px',
                                marginBottom: '2.5rem',
                                borderLeft: '4px solid var(--primary)',
                                textAlign: 'left'
                            }}>
                                <p style={{
                                    color: 'var(--text-primary)',
                                    fontSize: 'var(--text-small)',
                                    lineHeight: '1.5',
                                    fontWeight: 500,
                                    margin: 0
                                }}>
                                    ✨ {modalMessage.split('\n').slice(1).join(' ').trim() || 'Please pick up your order at the counter.'}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        padding: '1.25rem',
                                        fontSize: 'var(--text-body)',
                                        fontWeight: 700,
                                        borderRadius: 'var(--radius-xl)',
                                        width: '100%',
                                        boxShadow: '0 8px 20px var(--primary-glow)'
                                    }}
                                >
                                    I'M COMING!
                                </button>

                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        padding: '1rem',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        borderRadius: 'var(--radius-xl)',
                                        width: '100%',
                                        background: 'var(--surface-muted)',
                                        border: 'none',
                                        color: 'var(--brown)'
                                    }}
                                >
                                    <span>☕</span> Open Menu
                                </button>
                            </div>

                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    marginTop: '1.5rem',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    textDecoration: 'none'
                                }}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideDownBounce {
                    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes bellShake {
                    0% { transform: rotate(0); }
                    10% { transform: rotate(15deg); }
                    20% { transform: rotate(-10deg); }
                    30% { transform: rotate(10deg); }
                    40% { transform: rotate(-5deg); }
                    50% { transform: rotate(0); }
                    100% { transform: rotate(0); }
                }
            `}</style>
        </NotificationContext.Provider>
    );
}
