"use client";
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import CartDrawer from '@/components/CartDrawer';
import FloatingService from '@/components/FloatingService';
import { NotificationProvider } from '@/components/NotificationProvider';

export function Providers({ children }) {
    return (
        <ToastProvider>
            <NotificationProvider>
                <CartProvider>
                    {children}
                    <CartDrawer />
                    <FloatingService />
                </CartProvider>
            </NotificationProvider>
        </ToastProvider>
    );
}

