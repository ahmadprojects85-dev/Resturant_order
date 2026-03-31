import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        const { tableId } = await params;

        // Try to find by ID first, then by Label
        let table = await prisma.table.findUnique({
            where: { id: tableId }
        });

        if (!table) {
            table = await prisma.table.findFirst({
                where: { label: tableId }
            });
        }

        if (!table) {
            return NextResponse.json({ error: 'Table not found' }, { status: 404 });
        }

        // Find the active session for this table
        const session = await prisma.tableSession.findFirst({
            where: { table_id: table.id, status: 'ACTIVE' },
            include: {
                orders: {
                    include: {
                        items: { include: { item: true } }
                    },
                    orderBy: { created_at: 'desc' }
                }
            }
        });

        // Return session-scoped orders (or empty if no active session)
        return NextResponse.json({
            id: table.id,
            label: table.label,
            orders: session ? session.orders : []
        });
    } catch (error) {
        console.error('History API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
