import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const requests = await prisma.serviceRequest.findMany({
            where: { status: 'PENDING' },
            include: { table: true },
            orderBy: { created_at: 'asc' }
        });
        return NextResponse.json(requests);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const { requestId, status } = await req.json();

        const updated = await prisma.serviceRequest.update({
            where: { id: requestId },
            data: { status }
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }
}
