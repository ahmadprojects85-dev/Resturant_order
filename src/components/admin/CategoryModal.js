"use client";
import { useState, useEffect } from 'react';

export default function CategoryModal({ isOpen, onClose, category, onSave }) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (category) {
            setName(category.name);
        } else {
            setName('');
        }
    }, [category]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = '/api/admin/categories';
            const method = category ? 'PUT' : 'POST';
            const body = { name };
            if (category) body.id = category.id;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                onSave();
                onClose();
            } else {
                alert('Failed to save category');
            }
        } catch (error) {
            console.error(error);
            alert('Error saving category');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="overlay" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="card animate-scale-in" style={{
                padding: '2rem',
                width: '100%',
                maxWidth: '400px',
                margin: '1rem'
            }}>
                <h2 style={{
                    color: 'var(--brown)',
                    marginBottom: '1.5rem',
                    fontSize: '1.5rem',
                    fontWeight: 600
                }}>
                    {category ? 'Edit Category' : 'New Category'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            color: 'var(--text-secondary)',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: 500
                        }}>
                            Category Name
                        </label>
                        <input
                            type="text"
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Coffee, Pastries..."
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
                            {loading ? 'Saving...' : 'Save Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
