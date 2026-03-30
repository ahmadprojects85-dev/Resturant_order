import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPushNotification } from '@/lib/webpush';

export async function PUT(request, { params }) {
    try {
        const { orderId } = await params;
        const body = await request.json();
        const { status } = body;

        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: { table: true }
        });

        console.log(`Updated Order ${orderId} to ${status}`);

        // 🔔 Trigger push notification when order is READY
        if (status === 'READY') {
            const tableLabel = order.table?.label || '?';
            const shortId = orderId.slice(0, 6).toUpperCase();

            // Call our server-side function directly instead of making an HTTP fetch to ourselves
            sendPushNotification(
                orderId,
                '🍽️ Your Order is Ready!',
                `Table ${tableLabel} — Order #${shortId} is hot and ready to serve! ☕`,
                `/order/${shortId}`
            ).catch(err => console.warn('Push notification failed (non-critical):', err.message));
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('Update Status Error:', error, error.meta);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
