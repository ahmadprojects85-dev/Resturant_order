import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

async function checkAuth() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    if (!token) return false;
    const payload = await verifyToken(token.value);
    return !!payload;
}

export async function GET(request) {
    if (!await checkAuth()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const restaurant = await prisma.restaurant.findFirst({
            include: {
                categories: {
                    orderBy: { sort_order: 'asc' },
                    include: {
                        items: true // Include all items, even unavailable ones
                    }
                }
            }
        });

        if (!restaurant) {
            return NextResponse.json({ categories: [] });
        }

        return NextResponse.json(restaurant);
    } catch (error) {
        console.error('Fetch Menu Error:', error);
        return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
    }
}
