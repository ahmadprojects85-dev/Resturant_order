import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 🛡️ A07: Simple Memory-based Rate Limiter for Chat
const chatAttempts = new Map();
const CHAT_WINDOW = 60 * 1000; // 1 min
const MAX_CHAT = 10;

export async function POST(req, { params }) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();
        
        const record = chatAttempts.get(ip);
        if (record && (now - record.startTime > CHAT_WINDOW)) {
            chatAttempts.delete(ip);
        }

        const currentCount = chatAttempts.get(ip)?.count || 0;
        if (currentCount >= MAX_CHAT) {
            return NextResponse.json({ 
                error: 'Too many messages. Please wait a moment.' 
            }, { status: 429 });
        }

        const { tableId } = await params;
        const { text, sender } = await req.json();

        // Log attempt
        chatAttempts.set(ip, { count: currentCount + 1, startTime: record?.startTime || now });


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
