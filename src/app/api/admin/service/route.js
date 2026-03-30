import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

// Helper to check auth
async function checkAuth() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    if (!token) return false;
    const payload = await verifyToken(token.value);
    return !!payload;
}

export async function GET() {
    if (!await checkAuth()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
    if (!await checkAuth()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
