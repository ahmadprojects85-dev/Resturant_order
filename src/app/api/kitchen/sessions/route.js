import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Return all active table sessions (for the kitchen "Active Tables" bar)
export async function GET() {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Fetch active sessions AND all today's sessions in ONE parallel batch
        const [sessions, daySessions] = await Promise.all([
            prisma.tableSession.findMany({
                where: { status: 'ACTIVE' },
                include: {
                    table: true,
                    orders: {
                        select: {
                            id: true,
                            total_price: true,
                            status: true,
                            created_at: true
                        }
                    }
                },
                orderBy: { started_at: 'asc' }
            }),
            prisma.tableSession.findMany({
                where: { started_at: { gte: startOfDay } },
                select: { id: true, table_id: true },
                orderBy: { started_at: 'asc' }
            })
        ]);

        const data = sessions.map((s) => {
            const sessionsForThisTable = daySessions.filter(ds => ds.table_id === s.table.id);
            const sequence = sessionsForThisTable.findIndex(ds => ds.id === s.id) + 1;

            return {
                sessionId: s.id,
                tableId: s.table.id,
                tableLabel: s.table.label,
                startedAt: s.started_at,
                orderCount: s.orders.length,
                grandTotal: s.orders.reduce((sum, o) => sum + o.total_price, 0),
                allCompleted: s.orders.length > 0 && s.orders.every(o => o.status === 'COMPLETED'),
                sessionSequence: sequence || 1
            };
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('Active Sessions API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}
