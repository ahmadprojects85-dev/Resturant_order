import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Ensure no caching for live dashboard

export async function GET() {
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: {
                    not: 'COMPLETED'
                }
            },
            include: {
                table: true,
                items: {
                    include: {
                        item: true
                    }
                }
            },
            orderBy: {
                created_at: 'asc' // Oldest orders first
            }
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Kitchen API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
