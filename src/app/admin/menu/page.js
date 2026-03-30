"use client";
import { useState, useEffect } from 'react';
import CategoryModal from '@/components/admin/CategoryModal';
import ItemModal from '@/components/admin/ItemModal';

export default function MenuManagement() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

    useEffect(() => {
        fetchMenu();
    }, [refreshTrigger]);

    const fetchMenu = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/menu');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => setRefreshTrigger(prev => prev + 1);

    const handleDeleteCategory = async (id) => {
        if (!confirm('Are you sure you want to delete this category? It must be empty first.')) return;
        try {
            const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
            if (res.ok) handleRefresh();
            else alert('Failed to delete category (must be empty)');
        } catch (e) { console.error(e); }
    };

    const handleDeleteItem = async (id) => {
        if (!confirm('Delete this item?')) return;
        try {
            const res = await fetch(`/api/admin/items?id=${id}`, { method: 'DELETE' });
            if (res.ok) handleRefresh();
            else alert('Failed to delete item');
        } catch (e) { console.error(e); }
    };

    const handleToggleAvailability = async (item) => {
        try {
            const res = await fetch('/api/admin/items', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: item.id,
                    is_available: !item.is_available
                })
            });
            if (res.ok) handleRefresh();
            else alert('Failed to update status');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--background)',
            padding: '2rem 1rem'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* Header */}
                <header style={{
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <h1 className="text-display" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span>☕</span>
                            <span>Menu Management</span>
                        </h1>
                        <p className="text-secondary" style={{ marginTop: '0.25rem', fontSize: 'var(--text-body)' }}>
                            Customize your restaurant's offerings
                        </p>
                    </div>
                    <button
                        onClick={() => { setEditingCategory(null); setIsCatModalOpen(true); }}
                        className="btn btn-primary"
                    >
                        <span>+</span>
                        <span>Add Category</span>
                    </button>
                </header>

                {/* Content */}
                {
                    loading && !data ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '4rem',
                            fontSize: '1.25rem',
                            color: 'var(--text-secondary)'
                        }}>
                            Loading menu...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {data?.categories?.map((category) => (
                                <div
                                    key={category.id}
                                    className="card"
                                    style={{ overflow: 'hidden' }}
                                >
                                    {/* Category Header */}
                                    <div style={{
                                        padding: '1.25rem 1.5rem',
                                        background: 'var(--surface-muted)',
                                        borderBottom: '1px solid var(--border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <h2 className="text-heading" style={{ color: 'var(--brown)' }}>
                                            {category.name}
                                        </h2>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => { setEditingCategory(category); setIsCatModalOpen(true); }}
                                                className="btn-icon"
                                                style={{ width: '36px', height: '36px' }}
                                                title="Edit Category"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(category.id)}
                                                className="btn-icon"
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    background: 'var(--error-bg)',
                                                    color: 'var(--error)'
                                                }}
                                                title="Delete Category"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>

                                    {/* Items Grid */}
                                    <div style={{ padding: '1.5rem' }}>
                                        {category.items.length === 0 ? (
                                            <p style={{
                                                color: 'var(--text-muted)',
                                                fontStyle: 'italic',
                                                textAlign: 'center',
                                                padding: '1rem'
                                            }}>
                                                No items in this category.
                                            </p>
                                        ) : (
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                                gap: '1rem'
                                            }}>
                                                {category.items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        style={{
                                                            background: 'var(--surface-muted)',
                                                            padding: '1rem',
                                                            borderRadius: 'var(--radius-lg)',
                                                            display: 'flex',
                                                            gap: '1rem',
                                                            alignItems: 'center',
                                                            opacity: item.is_available ? 1 : 0.6,
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        {/* Image */}
                                                        {item.image ? (
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                style={{
                                                                    width: '64px',
                                                                    height: '64px',
                                                                    borderRadius: 'var(--radius-md)',
                                                                    objectFit: 'cover',
                                                                    filter: item.is_available ? 'none' : 'grayscale(1)'
                                                                }}
                                                            />
                                                        ) : (
                                                            <div style={{
                                                                width: '64px',
                                                                height: '64px',
                                                                borderRadius: 'var(--radius-md)',
                                                                background: 'var(--border)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '1.5rem'
                                                            }}>
                                                                ☕
                                                            </div>
                                                        )}

                                                        {/* Info */}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <h3 className="text-title" style={{
                                                                color: 'var(--text-primary)',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}>
                                                                {item.name}
                                                            </h3>
                                                            <p className="price" style={{ marginTop: '0.25rem' }}>
                                                                ${item.price.toFixed(2)}
                                                            </p>
                                                            {!item.is_available && (
                                                                <span style={{
                                                                    fontSize: '0.75rem',
                                                                    color: 'var(--error)',
                                                                    fontWeight: 600
                                                                }}>
                                                                    SOLD OUT
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '0.25rem'
                                                        }}>
                                                            <button
                                                                onClick={() => handleToggleAvailability(item)}
                                                                className="btn-icon"
                                                                style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    background: item.is_available
                                                                        ? 'var(--success-bg)'
                                                                        : 'var(--error-bg)',
                                                                    fontSize: '0.875rem'
                                                                }}
                                                                title={item.is_available ? "Mark as Sold Out" : "Mark as Available"}
                                                            >
                                                                {item.is_available ? '✅' : '❌'}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingItem(item);
                                                                    setSelectedCategoryId(category.id);
                                                                    setIsItemModalOpen(true);
                                                                }}
                                                                className="btn-icon"
                                                                style={{ width: '32px', height: '32px', fontSize: '0.875rem' }}
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteItem(item.id)}
                                                                className="btn-icon"
                                                                style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    background: 'var(--error-bg)',
                                                                    fontSize: '0.875rem'
                                                                }}
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add Item Button */}
                                        <button
                                            onClick={() => {
                                                setEditingItem(null);
                                                setSelectedCategoryId(category.id);
                                                setIsItemModalOpen(true);
                                            }}
                                            style={{
                                                marginTop: '1rem',
                                                width: '100%',
                                                padding: '0.875rem',
                                                background: 'transparent',
                                                border: '2px dashed var(--border-light)',
                                                borderRadius: 'var(--radius-lg)',
                                                color: 'var(--text-muted)',
                                                cursor: 'pointer',
                                                fontWeight: 500,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            + Add Item to {category.name}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                }
            </div >

            {/* Modals */}
            < CategoryModal
                isOpen={isCatModalOpen}
                onClose={() => setIsCatModalOpen(false)
                }
                category={editingCategory}
                onSave={handleRefresh}
            />
            <ItemModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                item={editingItem}
                categoryId={selectedCategoryId}
                onSave={handleRefresh}
            />
        </div >
    );
}
