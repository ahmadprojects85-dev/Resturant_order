import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Return the current active session + its orders for this table
export async function GET(request, { params }) {
    try {
        const { tableId } = await params;

        // Find table by ID or label
        let table = await prisma.table.findUnique({ where: { id: tableId } });
        if (!table) {
            table = await prisma.table.findFirst({ where: { label: tableId } });
        }
        if (!table) {
            return NextResponse.json({ error: 'Table not found' }, { status: 404 });
        }

        // Find active session
        let session = await prisma.tableSession.findFirst({
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

        if (!session) {
            return NextResponse.json({
                session: null,
                table: { id: table.id, label: table.label },
                orders: [],
                grandTotal: 0
            });
        }

        const grandTotal = session.orders.reduce((sum, o) => sum + o.total_price, 0);

        return NextResponse.json({
            session: {
                id: session.id,
                started_at: session.started_at,
                status: session.status
            },
            table: { id: table.id, label: table.label },
            orders: session.orders,
            grandTotal
        });
    } catch (error) {
        console.error('Session GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }
}

// POST: Close current session + start a new one ("Close Table" action)
export async function POST(request, { params }) {
    try {
        const { tableId } = await params;

        // Find table
        let table = await prisma.table.findUnique({ where: { id: tableId } });
        if (!table) {
            table = await prisma.table.findFirst({ where: { label: tableId } });
        }
        if (!table) {
            return NextResponse.json({ error: 'Table not found' }, { status: 404 });
        }

        // Close all active sessions for this table
        await prisma.tableSession.updateMany({
            where: { table_id: table.id, status: 'ACTIVE' },
            data: { status: 'CLOSED', closed_at: new Date() }
        });

        // Also clear chat messages for privacy
        await prisma.chatMessage.deleteMany({
            where: { table_id: table.id }
        });

        // Also clear pending service requests
        await prisma.serviceRequest.deleteMany({
            where: { table_id: table.id, status: 'PENDING' }
        });

        return NextResponse.json({
            success: true,
            message: `Table ${table.label} closed and ready for next customer`
        });
    } catch (error) {
        console.error('Session POST Error:', error);
        return NextResponse.json({ error: 'Failed to close table' }, { status: 500 });
    }
}
