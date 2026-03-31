import { NextResponse } from 'next/server';
import webpush from 'web-push';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// POST /api/push/send — called internally when order status changes to READY
export async function POST(request) {
    try {
        const { orderId, title, body, url } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        // Load all push subscriptions for this order
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { order_id: orderId }
        });

        if (subscriptions.length === 0) {
            return NextResponse.json({ sent: 0, message: 'No subscriptions found' });
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
                    // If subscription is expired/invalid, remove it
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
        return NextResponse.json({ sent, failed });

    } catch (error) {
        console.error('Push Send Error:', error);
        return NextResponse.json({ error: 'Failed to send push' }, { status: 500 });
    }
}
