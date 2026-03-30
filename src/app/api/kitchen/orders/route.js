import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Ensure no caching for live dashboard

export async function GET() {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Fetch orders AND sessions in ONE parallel batch
        const [orders, daySessions] = await Promise.all([
            prisma.order.findMany({
                where: {
                    status: { notIn: ['COMPLETED', 'CANCELLED'] }
                },
                include: {
                    table: true,
                    items: { include: { item: true } }
                },
                orderBy: { created_at: 'asc' }
            }),
            prisma.tableSession.findMany({
                where: { started_at: { gte: startOfDay } },
                select: { id: true, table_id: true },
                orderBy: { started_at: 'asc' }
            })
        ]);

        const ordersWithSequence = orders.map((order) => {
            let sequence = 1;
            if (order.session_id) {
                const sessionsForThisTable = daySessions.filter(ds => ds.table_id === order.table_id);
                const sessionIndex = sessionsForThisTable.findIndex(ds => ds.id === order.session_id);
                sequence = sessionIndex !== -1 ? sessionIndex + 1 : 1;
            }

            return {
                ...order,
                sessionSequence: sequence || 1
            };
        });

        return NextResponse.json(ordersWithSequence);
    } catch (error) {
        console.error('Kitchen API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
