"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OrderStatusPage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(0); // 0: Received, 1: Preparing, 2: Ready, -1: Cancelled
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const prevStatusRef = useRef(0);
  const timerEndedRef = useRef(false);

  // Helper: play a sound using Web Audio API (works even without user click if AudioContext was unlocked)
  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (type === 'confirm') {
        // Pleasant confirmation chime: two ascending tones
        [523, 659, 784].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          const t = ctx.currentTime + i * 0.15;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
          osc.start(t);
          osc.stop(t + 0.3);
        });
      } else if (type === 'ready') {
        // ✨ Balanced notification — cheerful but not aggressive
        const playNote = (freq, start, duration, volume = 0.2) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(volume, start + 0.03);
          gain.gain.setValueAtTime(volume * 0.8, start + duration * 0.5);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          osc.start(start);
          osc.stop(start + duration);
        };
        const now = ctx.currentTime;
        // First phrase — bright ascending ding-ding
        playNote(784, now, 0.35, 0.25);           // G5
        playNote(1047, now + 0.25, 0.5, 0.25);    // C6
        // Brief pause, then repeat slightly higher (attention grab)
        playNote(880, now + 1.0, 0.35, 0.25);     // A5
        playNote(1175, now + 1.25, 0.6, 0.25);    // D6
        // Warm undertone
        playNote(523, now + 0.25, 0.8, 0.08);     // C5
        playNote(587, now + 1.25, 0.8, 0.08);     // D5
        // Soft harmony underneath
        playNote(392, now + 0.8, 2.0, 0.06);    // G4
        playNote(330, now + 1.2, 2.0, 0.05);    // E4
      }
    } catch (e) {
      console.warn('Sound failed:', e);
    }
  };

  // Poll real status
  useEffect(() => {
    if (!params.orderId) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${params.orderId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          let step = 0;
          if (json.status === 'PREPARING') step = 1;
          if (json.status === 'READY') step = 2;
          if (json.status === 'COMPLETED') step = 2;
          if (json.status === 'CANCELLED') step = -1;
          setStatus((prev) => prev !== -1 ? step : prev);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [params.orderId]);

  // Countdown timer for cancellation
  useEffect(() => {
    if (data && status === 0 && data.created_at) {
      const orderTime = new Date(data.created_at).getTime();
      const calculateTimeLeft = () => Math.max(0, 15 - Math.floor((Date.now() - orderTime) / 1000));

      setTimeLeft(calculateTimeLeft());

      const timer = setInterval(() => {
        const remaining = calculateTimeLeft();
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
          // Play confirmation chime when timer reaches 0 (order is locked in!)
          if (!timerEndedRef.current) {
            timerEndedRef.current = true;
            playSound('confirm');
          }
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [data, status]);

  // Ring loudly when order status changes to READY
  useEffect(() => {
    if (status === 2 && prevStatusRef.current !== 2) {
      playSound('ready');
    }
    prevStatusRef.current = status;
  }, [status]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/orders/${params.orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL' })
      });
      if (res.ok) {
        setStatus(-1);
        setTimeLeft(0);
      } else {
        const json = await res.json();
        alert(json.error || 'Too late to cancel, the kitchen has started making your order!');
      }
    } catch (e) {
      console.error(e);
      alert('Network error while cancelling.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCallWaiter = async () => {
    if (waiterCalled || isCallingWaiter || !data?.table_id) return;
    setIsCallingWaiter(true);
    try {
      const res = await fetch(`/api/table/${data.table_id}/service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CALL',
          message: `Customer at Table ${data.table?.label || '?'} needs assistance (from order #${params.orderId.slice(0, 6).toUpperCase()})`
        })
      });
      if (res.ok) {
        setWaiterCalled(true);
        playSound('confirm');
        // Reset after 30 seconds so they can call again
        setTimeout(() => setWaiterCalled(false), 30000);
      }
    } catch (e) {
      console.error('Failed to call waiter:', e);
    } finally {
      setIsCallingWaiter(false);
    }
  };

  const steps = [
    { label: "Received", icon: "📋", desc: "Order confirmed" },
    { label: "Preparing", icon: "☕", desc: "Brewing now" },
    { label: "Ready", icon: "✨", desc: "Pick up at counter" },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse" style={{ fontSize: '2.5rem' }}>☕</div>
      </div>
    );
  }

  if (status === -1) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
        <h1 className="text-display" style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Order Cancelled</h1>
        <p className="text-secondary" style={{ marginBottom: '2rem', textAlign: 'center' }}>Your order has been successfully cancelled. You have not been charged.</p>
        <Link href={`/r/coffee-house/t/${data?.table?.label || '1'}`} className="btn btn-primary btn-lg">Return to Menu</Link>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem 1rem 4rem'
    }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>

        {/* Header */}
        <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', margin: '0 auto 1.5rem', boxShadow: 'var(--shadow-sm)'
          }}>
            {steps[status].icon}
          </div>
          <h1 className="text-display" style={{ marginBottom: '0.5rem' }}>
            {steps[status].label}
          </h1>
          <p className="text-secondary" style={{ fontSize: 'var(--text-body)' }}>
            Order #{params.orderId.slice(0, 6).toUpperCase()}
          </p>
        </div>

        {/* Modern Horizontal Progress Tracker */}
        <div style={{
          background: 'var(--surface)',
          padding: '2.5rem 1.5rem',
          borderRadius: 'var(--radius-3xl)',
          boxShadow: 'var(--shadow-lg)',
          marginBottom: '2rem',
          border: '1px solid var(--border)',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1
          }}>
            {steps.map((step, index) => {
              const isActive = index <= status;
              const isProcessing = index === status && status < 2;

              return (
                <div key={index} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative'
                }}>
                  {/* Step Circle */}
                  <div className={isProcessing ? 'animate-pulse' : ''} style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    background: isActive ? 'var(--primary)' : 'var(--surface-muted)',
                    color: isActive ? 'white' : 'var(--text-muted)',
                    border: `3px solid ${isActive ? 'transparent' : 'var(--border)'}`,
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 2
                  }}>
                    {index < status ? '✓' : step.icon}
                  </div>

                  {/* Labels */}
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <p style={{
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--brown)' : 'var(--text-muted)',
                      fontSize: 'var(--text-small)',
                      marginBottom: '0.25rem'
                    }}>
                      {step.label}
                    </p>
                    <p style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                      opacity: isActive ? 1 : 0.5
                    }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connecting Lines (Background) */}
          <div style={{
            position: 'absolute',
            top: 'calc(2.5rem + 24px - 2px)',
            left: 'calc(1.5rem + 16.66% + 24px)',
            right: 'calc(1.5rem + 16.66% + 24px)',
            height: '4px',
            background: 'var(--border)',
            zIndex: 0
          }} />

          {/* Connecting Lines (Active) */}
          <div style={{
            position: 'absolute',
            top: 'calc(2.5rem + 24px - 2px)',
            left: 'calc(1.5rem + 16.66% + 24px)',
            width: status === 0 ? '0%' : status === 1 ? '50%' : '100%',
            height: '4px',
            background: 'var(--primary)',
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 0
          }} />
        </div>

        {/* Items Summary Card */}
        {data && data.items && (
          <div className="animate-fade-in-up" style={{
            background: 'var(--surface)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--border)',
            marginBottom: '2rem'
          }}>
            <h3 className="text-title" style={{ marginBottom: '1rem' }}>
              Order Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', marginRight: '0.5rem' }}>{item.quantity}x</span>
                    {item.item?.name || 'Item'}
                  </span>
                  <span style={{ fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed var(--border)', marginTop: '0.5rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-heading" style={{ color: 'var(--brown)' }}>Total Paid</span>
                <span className="price" style={{ fontSize: 'var(--text-h2)' }}>${data.total_price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Notice */}
        <div className="animate-fade-in-up" style={{
          textAlign: 'center', padding: '1.5rem', background: 'rgba(217, 123, 61, 0.05)',
          borderRadius: 'var(--radius-2xl)', border: '1px solid rgba(217, 123, 61, 0.1)',
          marginBottom: '2.5rem'
        }}>
          <p style={{ color: 'var(--brown)', fontWeight: 600, fontSize: 'var(--text-body)' }}>
            {status === 2
              ? "✨ Your order is fresh and ready! Please pick it up at the counter."
              : "☕ We'll let you know as soon as your order is ready to serve."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="animate-fade-in-up" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {status === 0 && timeLeft > 0 && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="btn btn-lg btn-full"
              style={{ background: '#ef4444', border: 'none', color: 'white', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              {isCancelling ? 'Cancelling...' : `Cancel Order (${timeLeft}s)`}
            </button>
          )}

          <button
            onClick={handleCallWaiter}
            disabled={waiterCalled || isCallingWaiter}
            className="btn btn-lg btn-full"
            style={{
              background: waiterCalled ? 'rgba(76, 175, 80, 0.1)' : 'var(--surface)',
              color: waiterCalled ? '#4CAF50' : 'var(--brown)',
              border: waiterCalled ? '2px solid rgba(76, 175, 80, 0.3)' : '1px solid var(--border)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              cursor: waiterCalled ? 'default' : 'pointer'
            }}
          >
            {isCallingWaiter ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Calling...</span>
              </>
            ) : waiterCalled ? (
              <>
                <span>✅</span>
                <span>Waiter Notified! They're on the way.</span>
              </>
            ) : (
              <>
                <span>🙋‍♂️</span>
                <span>Need something else? Call Waiter</span>
              </>
            )}
          </button>

          <Link
            href={data?.table ? `/r/coffee-house/t/${data.table.label || data.table_id}` : '/r/coffee-house/t/1'}
            className="btn btn-primary btn-lg btn-full"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ← Back to Menu
          </Link>
        </div>

        {/* Footer info */}
        <p style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Thank you for choosing Antigravity Coffee ☕<br />
          Order ID: {params.orderId}
        </p>
      </div>
    </div>
  );
}
