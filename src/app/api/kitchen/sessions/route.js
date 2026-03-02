import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Return all active table sessions (for the kitchen "Active Tables" bar)
export async function GET() {
    try {
        const sessions = await prisma.tableSession.findMany({
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
        });

        return NextResponse.json(sessions.map(s => ({
            sessionId: s.id,
            tableId: s.table.id,
            tableLabel: s.table.label,
            startedAt: s.started_at,
            orderCount: s.orders.length,
            grandTotal: s.orders.reduce((sum, o) => sum + o.total_price, 0),
            allCompleted: s.orders.length > 0 && s.orders.every(o => o.status === 'COMPLETED')
        })));
    } catch (error) {
        console.error('Active Sessions API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}
