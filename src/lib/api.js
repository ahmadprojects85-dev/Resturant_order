const API_BASE = '/api';

export const api = {
    /**
     * Fetch menu data for a restaurant
     * @param {string} slug 
     * @returns {Promise<{restaurant: Object, categories: Array, items: Array}>}
     */
    async getMenu(slug) {
        const res = await fetch(`${API_BASE}/r/${slug}`);
        if (!res.ok) throw new Error('Failed to fetch menu');
        return res.json();
    },

    /**
     * Place an order
     * @param {string} tableId 
     * @param {Array} items 
     * @returns {Promise<{success: boolean, orderId: string}>}
     */
    async placeOrder(tableId, items) {
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableId, items })
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Order failed:", res.status, errorText);
            throw new Error(`Failed to place order: ${res.status} ${errorText}`);
        }
        return res.json();
    }
};
