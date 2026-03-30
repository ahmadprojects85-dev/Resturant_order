import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
 
 // Helper to check auth
 async function checkAuth() {
     const cookieStore = await cookies();
     const token = cookieStore.get('auth_token');
     if (!token) return false;
     const payload = await verifyToken(token.value);
     return !!payload;
 }

export async function POST(request) {
    if (!await checkAuth()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Find the first restaurant (MVP shortcut)
        const restaurant = await prisma.restaurant.findFirst();
        if (!restaurant) {
            return NextResponse.json({ error: 'No restaurant found' }, { status: 500 });
        }

        // Get highest sort order to append
        const lastCategory = await prisma.menuCategory.findFirst({
            where: { restaurant_id: restaurant.id },
            orderBy: { sort_order: 'desc' }
        });

        const newSortOrder = (lastCategory?.sort_order || 0) + 1;

        const category = await prisma.menuCategory.create({
            data: {
                name,
                restaurant_id: restaurant.id,
                sort_order: newSortOrder
            }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error('Create Category Error:', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}

export async function PUT(request) {
    if (!await checkAuth()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, name } = body;

        if (!id || !name) {
            return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 });
        }

        const category = await prisma.menuCategory.update({
            where: { id },
            data: { name }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error('Update Category Error:', error);
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
}

export async function DELETE(request) {
    if (!await checkAuth()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Check for items
        const itemsCount = await prisma.menuItem.count({
            where: { category_id: id }
        });

        if (itemsCount > 0) {
            return NextResponse.json({ error: 'Cannot delete category with items' }, { status: 400 });
        }

        await prisma.menuCategory.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Category Error:', error);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}
