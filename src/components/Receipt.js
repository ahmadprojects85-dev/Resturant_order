"use client";
import { useRef } from 'react';
import html2canvas from 'html2canvas';

export default function Receipt({ order, restaurant }) {
    const receiptRef = useRef(null);

    const handleDownload = async () => {
        if (!receiptRef.current) return;

        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2, // High resolution
                backgroundColor: '#ffffff'
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `Receipt-${order.shortId}.png`;
            link.click();
        } catch (error) {
            console.error("Failed to generate receipt image", error);
        }
    };

    if (!order) return null;

    const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div
                ref={receiptRef}
                style={{
                    background: 'white',
                    color: 'black',
                    padding: '2rem',
                    borderRadius: '4px',
                    width: '100%',
                    maxWidth: '380px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontFamily: "'Courier Prime', 'Courier New', monospace"
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px dashed #000', paddingBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>{restaurant?.name || "The Coffee House"}</h2>
                    <p style={{ fontSize: '0.9rem', color: '#555' }}>Table {order.table}</p>
                    <p style={{ fontSize: '0.9rem', color: '#555' }}>#{order.shortId}</p>
                    <p style={{ fontSize: '0.9rem', color: '#555' }}>{new Date(order.time || order.created_at).toLocaleString()}</p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                            <span style={{ display: 'flex', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 600 }}>{item.quantity}x</span>
                                <span>{item.name || item.item?.name}</span>
                            </span>
                            <span style={{ fontWeight: 600 }}>${((item.price) * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div style={{ borderTop: '2px dashed #000', paddingTop: '1rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
                        <span>TOTAL</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <div style={{ background: 'black', width: '120px', height: '120px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            {/* Placeholder QR */}
                            QR CODE
                        </div>
                        <p style={{ fontSize: '0.8rem', marginTop: '1rem', textTransform: 'uppercase' }}>Thank you for dining with us!</p>
                    </div>
                </div>
            </div>

            <button
                onClick={handleDownload}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <span>⬇️</span> Download Receipt
            </button>
        </div>
    );
}
