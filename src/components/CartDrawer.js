"use client";
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, cartTotal, clearCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
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
        showToast("Order placed successfully! 🎉", "success");
        clearCart();
        setIsCartOpen(false);
        router.push(`/order/${result.orderId}`);
      }
    } catch (error) {
      showToast("Failed to place order. Please try again.", "error");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--brown)' }}>Your Basket</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
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
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--brown)', marginBottom: '0.5rem' }}>
                Your Basket is Empty
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
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
                    <h4 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {item.name}
                    </h4>
                    <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1rem' }}>
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
                <span style={{ color: 'var(--text-secondary)' }}>Items Total</span>
                <span style={{ fontWeight: 600 }}>${cartTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border)' }}>
                <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--brown)' }}>Total to Pay</span>
                <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)' }}>${cartTotal.toFixed(2)}</span>
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
    </>
  );
}
