import webpush from 'web-push';
import prisma from '@/lib/prisma';

// Helper file to send push notifications directly from Node backend
// instead of making recursive HTTP fetch calls (which can fail in Next.js).

let vapidConfigured = false;

function configureVapid() {
    if (vapidConfigured) return;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.VAPID_EMAIL || 'mailto:admin@coffeehouse.com';

    if (publicKey && privateKey) {
        webpush.setVapidDetails(email, publicKey, privateKey);
        vapidConfigured = true;
    }
}

export async function sendPushNotification(orderId, title, body, url) {
    try {
        configureVapid();
        if (!vapidConfigured) {
            console.warn('VAPID keys not configured, skipping push notification.');
            return { sent: 0 };
        }

        // Load all push subscriptions for this order
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { order_id: orderId }
        });

        if (subscriptions.length === 0) {
            return { sent: 0, message: 'No subscriptions found' };
        }

        const payload = JSON.stringify({
            title: title || '🍽️ Your Order is Ready!',
            body: body || 'Come pick it up — it\'s hot and fresh! ☕',
            orderId,
            url: url || '/'
        });

        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth }
                        },
                        payload
                    );
                } catch (err) {
                    // Clean up invalid/expired subscriptions automatically
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => { });
                    }
                    throw err;
                }
            })
        );

        const sent = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`Push sent: ${sent} success, ${failed} failed for order ${orderId}`);
        return { sent, failed };

    } catch (error) {
        console.error('Push Send Error:', error);
        return { error: 'Failed to send push' };
    }
}
