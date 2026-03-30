import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/push/subscribe
// Called from the customer's browser after they allow notifications.
// Saves their push subscription linked to their orderId.
export async function POST(request) {
    try {
        const body = await request.json();
        const { subscription, orderId } = body;

        if (!subscription || !orderId) {
            return NextResponse.json({ error: 'Missing subscription or orderId' }, { status: 400 });
        }

        const { endpoint, keys } = subscription;
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return NextResponse.json({ error: 'Invalid subscription format' }, { status: 400 });
        }

        // Upsert: replace if same endpoint + orderId already exists
        await prisma.pushSubscription.upsert({
            where: { endpoint_order_id: { endpoint, order_id: orderId } },
            update: { p256dh: keys.p256dh, auth: keys.auth },
            create: {
                order_id: orderId,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Push Subscribe Error:', error);
        return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }
}
