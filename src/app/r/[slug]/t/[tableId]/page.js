"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { api } from '@/lib/api';

// Category icons mapping
const categoryIcons = {
  'Coffee': '☕',
  'Breakfast': '🍳',
  'Pastries': '🥐',
  'Cold Drinks': '🧊',
  'Tea': '🍵',
  'Specials': '⭐',
  'Desserts': '🍰',
  'Sandwiches': '🥪',
  'default': '🍽️'
};

export default function MenuPage() {
  const params = useParams();
  const { addToCart, cartCount, cartTotal, setIsCartOpen } = useCart();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  // Animation logic for cart button
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [prevCount, setPrevCount] = useState(cartCount);

  useEffect(() => {
    if (cartCount > prevCount) {
      setShouldAnimate(true);
      setTimeout(() => setShouldAnimate(false), 1500); // 1.5s animation
    }
    setPrevCount(cartCount);
  }, [cartCount, prevCount]);

  // Fetch Menu Data with Polling
  useEffect(() => {
    let isMounted = true;

    async function loadMenu(isFirstLoad = false) {
      try {
        const menuData = await api.getMenu(params.slug);
        if (isMounted) {
          setData(menuData);
          if (isFirstLoad && menuData.categories.length > 0) {
            setActiveCategory(menuData.categories[0].id);
          }
        }
      } catch (err) {
        console.error(err);
        if (isMounted && !data) setError("Failed to load menu. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMenu(true);
    const interval = setInterval(() => loadMenu(false), 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [params.slug]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--background)'
      }}>
        <div className="animate-pulse" style={{ fontSize: '2rem' }}>☕</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--background)',
        flexDirection: 'column'
      }}>
        <p className="text-secondary">{error || "Menu not found"}</p>
      </div>
    );
  }

  const { restaurant, categories, items: allItems } = data;
  const items = allItems.filter(item => item.category_id === activeCategory);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: cartCount > 0 ? '100px' : '20px' }}>

      {/* Category Navigation */}
      <nav className="scroll-hide" style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '1rem',
        overflowX: 'auto',
        background: 'var(--background)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        borderBottom: '1px solid var(--border)'
      }}>
        {/* Left Arrow */}
        <button
          className="btn-icon"
          style={{
            minWidth: '40px',
            height: '40px',
            flexShrink: 0,
            fontSize: '1rem'
          }}
        >
          ‹
        </button>

        {categories.map(cat => {
          const icon = categoryIcons[cat.name] || categoryIcons.default;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`category-item ${isActive ? 'active' : ''}`}
              style={{ cursor: 'pointer', border: 'none' }}
            >
              <div className="category-icon">
                {icon}
              </div>
              <span>{cat.name}</span>
            </button>
          );
        })}

        {/* Right Arrow */}
        <button
          className="btn-icon"
          style={{
            minWidth: '40px',
            height: '40px',
            flexShrink: 0,
            fontSize: '1rem'
          }}
        >
          ›
        </button>
      </nav>

      {/* Menu Grid */}
      <main className="menu-grid">
        {items.map((item, index) => (
          <MenuItem
            key={item.id}
            item={item}
            index={index}
            currency={restaurant.currency}
            addToCart={addToCart}
          />
        ))}
      </main>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <div className={`cart-bar ${shouldAnimate ? 'animate-lightning' : 'animate-slide-in-up'}`} style={{ transition: 'all 0.3s ease' }}>
          <span className="cart-bar-info">
            {cartCount} Items • {restaurant.currency}{cartTotal.toFixed(2)}
          </span>
          <button
            className="cart-bar-btn"
            onClick={() => setIsCartOpen(true)}
          >
            View Cart
          </button>
        </div>
      )}
    </div>
  );
}

function MenuItem({ item, index, currency, addToCart }) {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    addToCart(item, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      setQuantity(1); // Reset after adding
    }, 2000);
  };

  const increment = () => setQuantity(q => q + 1);
  const decrement = () => setQuantity(q => Math.max(1, q - 1));

  const totalPrice = (item.price * quantity).toFixed(2);

  return (
    <div
      className="menu-card animate-fade-in-up"
      style={{
        animationDelay: `${index * 0.05}s`,
        opacity: 0,
        position: 'relative'
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative' }}>
        {item.image && typeof item.image === 'string' && item.image.trim().length > 0 ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.image}
            alt={item.name}
            className="menu-card-image"
            style={{
              filter: item.is_available ? 'none' : 'grayscale(1) brightness(0.7)'
            }}
          />
        ) : (
          <div
            className="menu-card-image"
            style={{
              background: 'var(--surface-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem'
            }}
          >
            ☕
          </div>
        )}

        {/* Sold Out Overlay */}
        {!item.is_available && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(61, 38, 16, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{
              background: 'white',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--error)'
            }}>
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="menu-card-content">
        <h3 className="menu-card-title">{item.name}</h3>
        <p className="menu-card-price" style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          {item.description || "Freshly prepared for you"}
        </p>

        {item.is_available ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 'auto', flexWrap: 'wrap' }}>
            {/* Quantity Control - Pill Shape */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-full)',
              padding: '0.25rem',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              minWidth: '100px',
              flex: '1 1 100px',
              justifyContent: 'space-between'
            }}>
              <button
                onClick={decrement}
                style={{
                  width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem', color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >−</button>
              <span style={{
                fontWeight: 600, fontSize: '1.125rem', width: '20px', textAlign: 'center'
              }}>{quantity}</span>
              <button
                onClick={increment}
                style={{
                  width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem', color: 'var(--primary)',
                  cursor: 'pointer'
                }}
              >+</button>
            </div>

            {/* Add Button - Large Pill */}
            <button
              onClick={handleAdd}
              style={{
                flex: '999 1 140px', // Take remaining space but wrap if needed
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 'var(--radius-full)',
                padding: '0.75rem 1.25rem',
                fontSize: '1rem',
                fontWeight: 600,
                background: isAdded ? 'var(--success)' : 'var(--primary)',
                color: 'white',
                border: 'none',
                boxShadow: 'var(--shadow-md)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{isAdded ? 'Added' : 'Add'}</span>
              <span style={{ opacity: 0.9, marginLeft: '0.5rem' }}>{currency}{totalPrice}</span>
            </button>
          </div>
        ) : (
          <button disabled style={{
            width: '100%',
            padding: '0.875rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--surface-muted)',
            color: 'var(--text-muted)',
            cursor: 'not-allowed',
            fontWeight: 500
          }}>
            Currently Unavailable
          </button>
        )}
      </div>
    </div>
  );
}
