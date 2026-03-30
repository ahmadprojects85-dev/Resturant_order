// Service Worker for Push Notifications
// Handles background push events and shows native notifications

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: '🍽️ Order Update', body: event.data.text() };
    }

    const options = {
        body: data.body || 'Your order status has changed.',
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        tag: data.orderId || 'order-update',
        renotify: true,
        requireInteraction: true,   // Keep notification visible until tapped
        vibrate: [200, 100, 200, 100, 200],
        data: {
            url: data.url || '/',
            orderId: data.orderId
        },
        actions: [
            { action: 'view', title: '👀 View Order' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || '🍽️ Order Ready!', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
