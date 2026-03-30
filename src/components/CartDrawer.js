"use client";
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useState } from 'react';
import { useNotifications } from '@/components/NotificationProvider';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, cartTotal, clearCart } = useCart();
  const { showToast } = useToast();
  const { subscribeForOrder, askForPermission, permission, isSupported } = useNotifications() || {};
  const router = useRouter();
  const params = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  if (!isCartOpen) return null;

  // The actual order placement logic (called after notification choice)
  const placeOrderNow = async (notifGranted) => {
    try {
      setIsSubmitting(true);
      const tableId = params.tableId;

      if (!tableId) {
        showToast("Please scan a table QR code first!", "warning");
        router.push('/');
        return;
      }

      const result = await api.placeOrder(tableId, cart);

      if (result.success) {
        if (notifGranted) {
          showToast("Order placed! We'll notify you when it's ready 🔔", "success");
        } else {
          showToast("Order placed! Check back here for updates.", "success");
        }
        clearCart();
        setIsCartOpen(false);

        // Subscribe for push notifications using the full DB order ID
        if (notifGranted && subscribeForOrder && result.dbOrderId) {
          subscribeForOrder(result.dbOrderId);
        }

        router.push(`/order/${result.orderId}`);
      }
    } catch (error) {
      showToast("Failed to place order. Please try again.", "error");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    // If notifications are already granted or not supported, skip the prompt
    if (!isSupported || permission === 'granted' || permission === 'denied') {
      if (askForPermission && permission !== 'denied') {
        await askForPermission();
      }
      await placeOrderNow(permission === 'granted');
      return;
    }

    // Show our friendly notification prompt
    setShowNotifPrompt(true);
  };

  const handleEnableNotifications = async () => {
    setShowNotifPrompt(false);
    let granted = false;
    if (askForPermission) {
      granted = await askForPermission();
    }
    await placeOrderNow(granted);
  };

  const handleSkipNotifications = async () => {
    setShowNotifPrompt(false);
    await placeOrderNow(false);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="overlay"
        onClick={() => setIsCartOpen(false)}
        style={{ zIndex: 100 }}
      />

      {/* Drawer */}
      <div className="animate-slide-in-up" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '90vh',
        background: 'var(--background)',
        borderRadius: 'var(--radius-3xl) var(--radius-3xl) 0 0',
        zIndex: 101,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
        borderTop: '1px solid var(--border)'
      }}>
        {/* Handle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            width: '50px',
            height: '5px',
            background: 'var(--border)',
            borderRadius: 'var(--radius-full)'
          }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 1.5rem 1.5rem',
          borderBottom: '1px solid var(--border)'
        }}>
          <div>
            <h2 className="text-heading" style={{ color: 'var(--brown)' }}>Your Basket</h2>
            <p className="text-secondary" style={{ fontSize: 'var(--text-small)' }}>
              {cart.length} {cart.length === 1 ? 'item' : 'items'} ready to order
            </p>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface-muted)',
              border: 'none',
              fontSize: '1.25rem',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="scroll-hide" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          {cart.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 1rem'
            }}>
              <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>☕</div>
              <h3 className="text-title" style={{ color: 'var(--brown)', marginBottom: '0.5rem' }}>
                Your Basket is Empty
              </h3>
              <p className="text-secondary" style={{ marginBottom: '2rem' }}>
                Browse our menu and pick some delicious treats!
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="btn btn-primary"
                style={{ borderRadius: 'var(--radius-full)', padding: '0.75rem 2rem' }}
              >
                Explore Menu
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {cart.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.25rem',
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius-2xl)',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {/* Item Image Preview (if available) */}
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-lg)', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '60px', height: '60px', borderRadius: 'var(--radius-lg)',
                      background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}>☕</div>
                  )}

                  {/* Item Info */}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: 600, fontSize: 'var(--text-body)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {item.name}
                    </h4>
                    <p className="price" style={{ fontSize: 'var(--text-body)' }}>
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity Controls - Talabat Style Pill */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--surface-muted)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.25rem',
                    border: '1px solid var(--border)'
                  }}>
                    <button
                      onClick={() => updateQuantity(index, -1)}
                      style={{
                        width: '32px', height: '32px', border: 'none', background: 'transparent',
                        fontSize: '1.25rem', color: 'var(--text-muted)', cursor: 'pointer'
                      }}
                    >−</button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(index, 1)}
                      style={{
                        width: '32px', height: '32px', border: 'none', background: 'transparent',
                        fontSize: '1.25rem', color: 'var(--primary)', cursor: 'pointer'
                      }}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{
            padding: '1.5rem 2rem 2.5rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
            boxShadow: '0 -5px 20px rgba(0,0,0,0.05)'
          }}>
            {/* Payment Summary */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="text-secondary" style={{ fontSize: 'var(--text-small)' }}>Items Total</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>${cartTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border)' }}>
                <span className="text-heading" style={{ color: 'var(--brown)' }}>Total to Pay</span>
                <span className="price" style={{ fontSize: 'var(--text-h2)' }}>${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Note */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: 'rgba(217, 123, 61, 0.08)', padding: '1rem',
              borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem',
              border: '1px solid rgba(217, 123, 61, 0.2)'
            }}>
              <span style={{ fontSize: '1.5rem' }}>💵</span>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--brown)', fontSize: '0.9rem' }}>Pay Cash at Counter</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Place your order now, pay when it's ready!</p>
              </div>
            </div>

            {/* Checkout Button - Lightning Animation */}
            <button
              className={`btn btn-primary btn-lg btn-full ${!isSubmitting ? 'animate-pulse' : ''}`}
              onClick={handleCheckout}
              disabled={isSubmitting}
              style={{
                height: '60px',
                borderRadius: 'var(--radius-full)',
                fontSize: '1.125rem',
                fontWeight: 700,
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Place Order</span>
                  <span style={{ fontSize: '1.25rem' }}>⚡</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 🔔 Notification Permission Prompt Modal */}
      {showNotifPrompt && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(61, 38, 16, 0.5)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          padding: '1.5rem',
          animation: 'notifFadeIn 0.3s ease'
        }}>
          <div style={{
            background: 'var(--surface, #fff)',
            padding: '2.5rem 2rem 2rem',
            borderRadius: '28px',
            maxWidth: '380px',
            width: '100%',
            boxShadow: '0 25px 60px rgba(61, 38, 16, 0.3)',
            textAlign: 'center',
            position: 'relative',
            border: '1px solid rgba(217, 123, 61, 0.15)',
            overflow: 'hidden',
            animation: 'notifSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            {/* Warm glow behind icon */}
            <div style={{
              position: 'absolute',
              top: '-30px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '160px',
              height: '160px',
              background: 'radial-gradient(circle, rgba(217, 123, 61, 0.25), transparent 70%)',
              borderRadius: '50%',
              zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Bell Icon */}
              <div style={{
                fontSize: '4rem',
                marginBottom: '1rem',
                filter: 'drop-shadow(0 6px 12px rgba(217, 123, 61, 0.3))',
                animation: 'notifBell 2s ease-in-out infinite'
              }}>
                🔔
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--brown, #3D2610)',
                marginBottom: '0.5rem',
                letterSpacing: '-0.02em'
              }}>
                Stay Updated!
              </h3>

              {/* Description */}
              <p style={{
                color: 'var(--text-secondary, #7A4F2C)',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                marginBottom: '1.75rem',
                padding: '0 0.5rem'
              }}>
                Turn on notifications so we can <strong>ring your phone</strong> when your order is hot and ready to pick up!
              </p>

              {/* Info box */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'rgba(76, 175, 80, 0.08)',
                padding: '0.85rem 1rem',
                borderRadius: '14px',
                marginBottom: '1.75rem',
                border: '1px solid rgba(76, 175, 80, 0.2)',
                textAlign: 'left'
              }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>📱</span>
                <span style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary, #7A4F2C)',
                  lineHeight: 1.4
                }}>
                  Without notifications, you'll need to <strong>keep checking back</strong> to know when your food is ready.
                </span>
              </div>

              {/* Enable Button */}
              <button
                onClick={handleEnableNotifications}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #D97B3D, #C2611F)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 20px rgba(217, 123, 61, 0.35)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  marginBottom: '0.75rem'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span>🔔</span>
                <span>Enable Notifications</span>
              </button>

              {/* Skip Button */}
              <button
                onClick={handleSkipNotifications}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: 'var(--surface-muted, #f5f0eb)',
                  color: 'var(--text-secondary, #7A4F2C)',
                  border: '1px solid var(--border, #e0d5c8)',
                  borderRadius: '14px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                Maybe Later
              </button>

              <p style={{
                marginTop: '1rem',
                fontSize: '0.7rem',
                color: 'var(--text-muted, #b0a090)',
                lineHeight: 1.4
              }}>
                You can always enable notifications later in your browser settings
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes notifFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes notifSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes notifBell {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-12deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-6deg); }
          50% { transform: rotate(0deg); }
        }
      `}</style>
    </>
  );
}
