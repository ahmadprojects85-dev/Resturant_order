import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 🛡️ A07: Simple Memory-based Rate Limiter for Service Requests
const serviceAttempts = new Map();
const SERVICE_WINDOW = 60 * 1000; // 1 min
const MAX_SERVICE = 3;

export async function POST(req, { params }) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();
        
        const record = serviceAttempts.get(ip);
        if (record && (now - record.startTime > SERVICE_WINDOW)) {
            serviceAttempts.delete(ip);
        }

        const currentCount = serviceAttempts.get(ip)?.count || 0;
        if (currentCount >= MAX_SERVICE) {
            return NextResponse.json({ 
                error: 'Too many requests. Please wait a moment.' 
            }, { status: 429 });
        }

        const { tableId } = await params;
        const { type, message } = await req.json();

        // Log attempt
        serviceAttempts.set(ip, { count: currentCount + 1, startTime: record?.startTime || now });


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
