"use client";
import { useState, useEffect } from 'react';

export default function ItemModal({ isOpen, onClose, item, categoryId, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        image: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name,
                description: item.description || '',
                price: item.price,
                image: item.image || ''
            });
        } else {
            setFormData({
                name: '',
                description: '',
                price: '',
                image: ''
            });
        }
    }, [item]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = '/api/admin/items';
            const method = item ? 'PUT' : 'POST';
            const body = {
                ...formData,
                categoryId: categoryId,
                id: item?.id
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                onSave();
                onClose();
            } else {
                alert('Failed to save item');
            }
        } catch (error) {
            console.error(error);
            alert('Error saving item');
        } finally {
            setLoading(false);
        }
    };

    const [uploadingImage, setUploadingImage] = useState(false);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600;
                const MAX_HEIGHT = 600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setFormData(prev => ({ ...prev, image: dataUrl }));
                setUploadingImage(false);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const inputStyle = {
        width: '100%',
        padding: '0.875rem',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-muted)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
        fontSize: '1rem',
        transition: 'all 0.2s ease'
    };

    const labelStyle = {
        display: 'block',
        color: 'var(--text-secondary)',
        marginBottom: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: 500
    };

    return (
        <div className="overlay" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="card animate-scale-in scroll-hide" style={{
                padding: '2rem',
                width: '100%',
                maxWidth: '480px',
                maxHeight: '90vh',
                overflowY: 'auto',
                margin: '1rem'
            }}>
                <h2 style={{
                    color: 'var(--brown)',
                    marginBottom: '1.5rem',
                    fontSize: '1.5rem',
                    fontWeight: 600
                }}>
                    {item ? 'Edit Item' : 'New Item'}
                </h2>

                <form onSubmit={handleSubmit} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
                }}>
                    {/* Name */}
                    <div>
                        <label style={labelStyle}>Item Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Caramel Latte"
                            required
                            style={inputStyle}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label style={labelStyle}>Description (optional)</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows="3"
                            placeholder="A short description of this item..."
                            style={{
                                ...inputStyle,
                                resize: 'vertical',
                                minHeight: '80px'
                            }}
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label style={labelStyle}>Price ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="4.50"
                            required
                            style={inputStyle}
                        />
                    </div>

                    {/* Image Upload / URL */}
                    <div>
                        <label style={labelStyle}>Item Image</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                                type="text"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                placeholder="Pase URL or click Upload ->"
                                style={{ ...inputStyle, flex: 1 }}
                            />
                            <label style={{
                                background: 'var(--primary)',
                                color: 'white',
                                padding: '0.875rem 1rem',
                                borderRadius: 'var(--radius-lg)',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                opacity: uploadingImage ? 0.7 : 1,
                                whiteSpace: 'nowrap'
                            }}>
                                <span>{uploadingImage ? '⏳' : '📸'}</span>
                                {uploadingImage ? 'Uploading...' : 'Upload'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                        {formData.image && (
                            <div style={{ marginTop: '0.75rem', position: 'relative' }}>
                                <img
                                    src={formData.image}
                                    alt="Preview"
                                    style={{
                                        width: '100%',
                                        height: '140px',
                                        objectFit: 'cover',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)'
                                    }}
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, image: '' })}
                                    style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        background: 'rgba(0,0,0,0.6)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.75rem',
                        marginTop: '0.5rem'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? 'Saving...' : 'Save Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
