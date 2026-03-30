"use client";
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [tableNumber, setTableNumber] = useState('');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #F8F3ED 0%, #EDE5DA 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Background Coffee Image */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        maxWidth: '600px',
        opacity: 0.15,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <img
          src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"
          alt=""
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: '50%'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="container" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 1rem',
        position: 'relative',
        zIndex: 1
      }}>

        {/* Title */}
        <div className="animate-fade-in-down" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 className="text-display" style={{ marginBottom: '0.5rem' }}>
            The Coffee House
          </h1>
          <p className="text-secondary" style={{ fontSize: 'var(--text-h3)', fontFamily: 'var(--font-display)', opacity: 0.8 }}>
            Artisan coffee & fresh pastries
          </p>
        </div>

        {/* Order Card */}
        <div
          className="card card-glass animate-fade-in-up"
          style={{
            padding: '2rem',
            width: '100%',
            maxWidth: '380px',
            textAlign: 'center'
          }}
        >
          {/* Table Input */}
          <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label
              className="text-small"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--text-secondary)',
                fontWeight: 500
              }}
            >
              Table Number
            </label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 12"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              style={{
                fontSize: '1.25rem',
                textAlign: 'center',
                padding: '1.25rem',
                background: 'white',
                fontFamily: 'var(--font-display)',
                fontWeight: 700
              }}
            />
          </div>

          {/* Start Order Button */}
          <Link
            href={tableNumber ? `/r/coffee-house/t/${tableNumber}` : '/r/coffee-house/t/1'}
            className="btn btn-primary btn-lg btn-full"
            style={{ marginBottom: '1.5rem' }}
          >
            Start Your Order
          </Link>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            margin: '1rem 0'
          }}>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
            <span className="text-caption">or</span>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
          </div>

          {/* Scan QR */}
          <button
            className="btn-icon"
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: 'var(--surface-muted)',
              borderRadius: 'var(--radius-full)'
            }}
          >
            <span style={{ fontSize: '1.75rem' }}>📱</span>
          </button>
          <p className="text-small text-secondary" style={{ marginTop: '0.75rem' }}>
            Scan Table
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        <p className="text-caption text-muted">
          Powered by QuickServe
        </p>
      </footer>
    </div>
  );
}
