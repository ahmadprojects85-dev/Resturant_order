"use client";
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import CartDrawer from '@/components/CartDrawer';
import FloatingService from '@/components/FloatingService';

export function Providers({ children }) {
    return (
        <ToastProvider>
            <CartProvider>
                {children}
                <CartDrawer />
                <FloatingService />
            </CartProvider>
        </ToastProvider>
    );
}
