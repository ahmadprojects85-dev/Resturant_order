import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
    try {
        // For MVP, we'll just fetch the first restaurant regardless of slug
        // In a real app, we would filter by: where: { slug: params.slug }
        const restaurant = await prisma.restaurant.findFirst({
            include: {
                categories: {
                    orderBy: { sort_order: 'asc' },
                    include: {
                        items: true
                    }
                }
            }
        });

        if (!restaurant) {
            return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
        }

        return NextResponse.json({
            restaurant: {
                id: restaurant.id,
                name: restaurant.name,
                description: restaurant.description,
                currency: restaurant.currency,
                coverImage: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=1000&q=80", // Hardcoded for now as it's not in schema yet
            },
            categories: restaurant.categories.map(c => ({
                id: c.id,
                name: c.name,
                sort_order: c.sort_order
            })),
            items: restaurant.categories.flatMap(c => c.items.map(i => ({
                id: i.id,
                category_id: c.id,
                name: i.name,
                description: i.description,
                price: i.price,
                image: i.image,
                is_available: i.is_available
            })))
        });
    } catch (error) {
        console.error('Request error', error);
        return NextResponse.json({ error: 'Error fetching menu' }, { status: 500 });
    }
}
