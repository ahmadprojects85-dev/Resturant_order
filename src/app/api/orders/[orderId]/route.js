import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
    try {
        const { orderId } = await params; // Next.js 15+ await params

        // If orderId is short (8 chars), search by startsWith. Otherwise unique.
        // Note: order creation returns .toUpperCase() IDs, so normalize to lowercase for lookup
        let order;
        if (orderId.length < 36) {
            order = await prisma.order.findFirst({
                where: {
                    id: { startsWith: orderId.toLowerCase() }
                },
                include: {
                    items: { include: { item: true } },
                    table: true
                }
            });
        } else {
            order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    items: { include: { item: true } },
                    table: true
                }
            });
        }

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('Order Status API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}
