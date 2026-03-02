"use client";
import React, { useRef } from 'react';

export default function ConsolidatedReceipt({ data, restaurantName = "The Coffee House" }) {
    const receiptRef = useRef(null);

    if (!data || !data.orders || data.orders.length === 0) return null;

    // Consolidate items: sum quantities of the same item
    const consolidatedItems = {};
    let grandTotal = 0;

    data.orders.forEach(order => {
        order.items.forEach(oItem => {
            const itemId = oItem.item_id;
            const itemPrice = oItem.price;
            const itemName = oItem.item?.name || oItem.name;

            if (consolidatedItems[itemId]) {
                consolidatedItems[itemId].quantity += oItem.quantity;
            } else {
                consolidatedItems[itemId] = {
                    name: itemName,
                    price: itemPrice,
                    quantity: oItem.quantity
                };
            }
            grandTotal += (itemPrice * oItem.quantity);
        });
    });

    const itemsArray = Object.values(consolidatedItems);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="receipt-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <div
                ref={receiptRef}
                className="receipt-content"
                style={{
                    background: 'white',
                    color: 'black',
                    padding: '2.5rem 2rem',
                    width: '100%',
                    maxWidth: '400px',
                    fontFamily: "'Courier Prime', 'Courier New', monospace",
                    boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
                    position: 'relative',
                    border: '1px solid #eee'
                }}
            >
                {/* Receipt Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px dashed #000', paddingBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {restaurantName}
                    </h2>
                    <p style={{ fontSize: '1rem', fontWeight: 600, margin: '0.5rem 0' }}>FINAL BILL - TABLE {data.label}</p>
                    <div style={{ fontSize: '0.85rem', color: '#333', marginTop: '0.75rem' }}>
                        <p>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p>Orders: {data.orders.length}</p>
                    </div>
                </div>

                {/* Items List */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 700 }}>
                        <span>ITEM</span>
                        <span>TOTAL</span>
                    </div>
                    {itemsArray.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600 }}>{item.name}</span>
                                <span style={{ fontSize: '0.85rem' }}>{item.quantity} x ${item.price.toFixed(2)}</span>
                            </div>
                            <span style={{ fontWeight: 700, alignSelf: 'flex-end' }}>
                                ${(item.price * item.quantity).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Total Section */}
                <div style={{ borderTop: '2px dashed #000', paddingTop: '1.5rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 800 }}>
                        <span>TOTAL</span>
                        <span>${grandTotal.toFixed(2)}</span>
                    </div>

                    <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                        <div style={{
                            border: '2px solid black',
                            width: '120px',
                            height: '120px',
                            margin: '0 auto',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '10px',
                            background: '#f9f9f9'
                        }}>
                            <div style={{ fontSize: '3rem' }}>🎫</div>
                            <span style={{ fontSize: '0.6rem', fontWeight: 700 }}>SCAN TO JOIN</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', marginTop: '1.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Thank you for visiting!</p>
                        <p style={{ fontSize: '0.75rem', color: '#666' }}>Please present this at the counter.</p>
                    </div>
                </div>

                {/* Decorative Zigzag edge (CSS) */}
                <div style={{
                    position: 'absolute',
                    bottom: '-10px',
                    left: 0,
                    width: '100%',
                    height: '10px',
                    background: 'linear-gradient(-45deg, white 5px, transparent 0), linear-gradient(45deg, white 5px, transparent 0)',
                    backgroundSize: '10px 10px',
                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.05))'
                }}></div>
            </div>

            <button
                onClick={handlePrint}
                className="btn btn-primary"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 2rem',
                    fontSize: '1.125rem',
                    boxShadow: 'var(--shadow-lg)'
                }}
            >
                <span style={{ fontSize: '1.5rem' }}>🖨️</span> Print Receipt
            </button>

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .receipt-content, .receipt-content * {
                        visibility: visible;
                    }
                    .receipt-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        max-width: 100% !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                    }
                    .receipt-container button {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
