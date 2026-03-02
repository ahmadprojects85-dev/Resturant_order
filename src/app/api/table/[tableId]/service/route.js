import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req, { params }) {
    try {
        const { tableId } = await params;
        const { type, message } = await req.json();

        // Find table by ID or Label
        let table = await prisma.table.findUnique({ where: { id: tableId } });
        if (!table) {
            table = await prisma.table.findFirst({ where: { label: tableId } });
        }

        if (!table) {
            return NextResponse.json({ error: 'Table not found' }, { status: 404 });
        }

        const serviceRequest = await prisma.serviceRequest.create({
            data: {
                table_id: table.id, // Use the actual internal UUID
                type,
                message,
                status: 'PENDING'
            },
            include: {
                table: true
            }
        });

        return NextResponse.json({ success: true, request: serviceRequest });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create service request' }, { status: 500 });
    }
}

export async function GET(req, { params }) {
    try {
        const { tableId } = await params;

        // Find table by ID or Label
        let table = await prisma.table.findUnique({ where: { id: tableId } });
        if (!table) {
            table = await prisma.table.findFirst({ where: { label: tableId } });
        }

        if (!table) {
            return NextResponse.json({ error: 'Table not found' }, { status: 404 });
        }

        const requests = await prisma.serviceRequest.findMany({
            where: { table_id: table.id, status: 'PENDING' },
            orderBy: { created_at: 'desc' }
        });
        return NextResponse.json(requests);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}
