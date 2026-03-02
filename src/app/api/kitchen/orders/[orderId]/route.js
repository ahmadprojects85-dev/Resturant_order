import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
    try {
        const { orderId } = await params; // Await params in Next.js 15+
        const body = await request.json();
        const { status } = body;

        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status }
        });

        console.log(`Updated Order ${orderId} to ${status}`);
        return NextResponse.json(order);
    } catch (error) {
        console.error('Update Status Error:', error, error.meta);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
