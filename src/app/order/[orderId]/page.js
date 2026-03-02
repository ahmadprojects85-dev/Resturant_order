"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OrderStatusPage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(0); // 0: Received, 1: Preparing, 2: Ready
  const [loading, setLoading] = useState(true);

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
          setStatus(step);
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
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brown)', marginBottom: '0.5rem' }}>
            {steps[status].label}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
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
                      fontSize: '0.9rem',
                      marginBottom: '0.25rem'
                    }}>
                      {step.label}
                    </p>
                    <p style={{
                      fontSize: '0.75rem',
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--brown)', marginBottom: '1rem' }}>
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
                <span style={{ fontWeight: 700, color: 'var(--brown)' }}>Total Paid</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>${data.total_price.toFixed(2)}</span>
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
          <p style={{ color: 'var(--brown)', fontWeight: 600, fontSize: '0.95rem' }}>
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
          <button className="btn btn-secondary btn-lg btn-full" style={{ background: 'var(--surface)', color: 'var(--brown)' }}>
            Need something else? Call Waiter
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
