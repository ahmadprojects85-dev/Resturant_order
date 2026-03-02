
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

async function checkAuth() {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    return token?.value === 'authenticated';
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
