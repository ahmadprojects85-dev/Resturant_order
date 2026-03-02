import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req, { params }) {
    try {
        const { tableId } = await params;
        const { text, sender } = await req.json();

        // Find table by ID or Label
        let table = await prisma.table.findUnique({ where: { id: tableId } });
        if (!table) {
            table = await prisma.table.findFirst({ where: { label: tableId } });
        }

        if (!table) {
            return NextResponse.json({ error: 'Table not found' }, { status: 404 });
        }

        const chatMessage = await prisma.chatMessage.create({
            data: {
                table_id: table.id,
                sender, // CUSTOMER or STAFF
                text
            }
        });

        // If it's a customer message, also create/update a ServiceRequest to alert the kitchen
        if (sender === 'CUSTOMER') {
            await prisma.serviceRequest.create({
                data: {
                    table_id: table.id,
                    type: 'CHAT',
                    message: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                    status: 'PENDING'
                }
            });
        }

        return NextResponse.json(chatMessage);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
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

        const messages = await prisma.chatMessage.findMany({
            where: { table_id: table.id },
            orderBy: { created_at: 'asc' }
        });
        return NextResponse.json(messages);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
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

        await prisma.chatMessage.deleteMany({
            where: { table_id: table.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to clear messages' }, { status: 500 });
    }
}
