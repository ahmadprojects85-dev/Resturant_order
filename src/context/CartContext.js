"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext();

export function CartProvider({ children }) {
    const { showToast } = useToast();
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [tableId, setTableId] = useState(null);

    // Load from local storage when tableId is set
    useEffect(() => {
        if (!tableId) return;

        const saved = localStorage.getItem(`cart_${tableId}`);
        if (saved) {
            try {
                setCart(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse cart", e);
                setCart([]);
            }
        } else {
            setCart([]);
        }
    }, [tableId]);

    // Save to local storage on change
    useEffect(() => {
        if (!tableId) return;
        localStorage.setItem(`cart_${tableId}`, JSON.stringify(cart));
    }, [cart, tableId]);

    const addToCart = (item, quantity = 1, notes = "") => {
        setCart(prev => {
            const existingIndex = prev.findIndex(i => i.id === item.id && i.notes === notes);

            if (existingIndex >= 0) {
                const newCart = [...prev];
                // CRITICAL: Create a copy of the item before modifying it
                // forcing a new reference so we don't mutate 'prev' state directly
                // which causes double-counting in React StrictMode
                newCart[existingIndex] = {
                    ...newCart[existingIndex],
                    quantity: newCart[existingIndex].quantity + quantity
                };
                return newCart;
            }

            return [...prev, { ...item, quantity, notes }];
        });
        showToast(`${item.name} added to cart! 🛒`, "success", 2000);
        // setIsCartOpen(true); // Don't auto-open cart (Talabat style)
    };

    const removeFromCart = (index) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const updateQuantity = (index, delta) => {
        setCart(prev => {
            const newCart = [...prev];
            const item = newCart[index];
            if (item.quantity + delta <= 0) {
                return prev.filter((_, i) => i !== index);
            }
            newCart[index] = { ...item, quantity: item.quantity + delta };
            return newCart;
        });
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartCount,
            isCartOpen,
            setIsCartOpen,
            tableId,
            setTableId
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
