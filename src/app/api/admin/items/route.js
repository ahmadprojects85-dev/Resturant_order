
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

async function checkAuth() {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    return token?.value === 'authenticated';
}

export async function POST(request) {
    if (!await checkAuth()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { categoryId, name, description, price, image } = body;

        if (!categoryId || !name || price === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const item = await prisma.menuItem.create({
            data: {
                category_id: categoryId,
                name,
                description,
                price: parseFloat(price),
                image,
                is_available: true
            }
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error('Create Item Error:', error);
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}

export async function PUT(request) {
    if (!await checkAuth()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, name, description, price, image, is_available } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const item = await prisma.menuItem.update({
            where: { id },
            data: {
                name,
                description,
                price: price !== undefined ? parseFloat(price) : undefined,
                image,
                is_available
            }
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error('Update Item Error:', error);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
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

        await prisma.menuItem.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Item Error:', error);
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
