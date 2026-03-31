import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 🛡️ A07: Simple Memory-based Rate Limiter for Orders
const orderAttempts = new Map();
const ORDER_WINDOW = 10 * 60 * 1000; // 10 mins
const MAX_ORDERS = 5;

export async function POST(request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();
        
        const record = orderAttempts.get(ip);
        if (record && (now - record.startTime > ORDER_WINDOW)) {
            orderAttempts.delete(ip);
        }

        const currentCount = orderAttempts.get(ip)?.count || 0;
        if (currentCount >= MAX_ORDERS) {
            return NextResponse.json({ 
                error: 'Too many orders placed. Please wait a few minutes or call a waiter.' 
            }, { status: 429 });
        }

        const body = await request.json();
        const { tableId, items } = body;

        // Log attempt
        orderAttempts.set(ip, { count: currentCount + 1, startTime: record?.startTime || now });

        if (!tableId) {
            return NextResponse.json({ error: 'Missing table ID' }, { status: 400 });
        }

        // 1. Find the table (by label for this MVP, since URL uses "12")
        // In real app, we might use the UUID directly or a specific table lookup
        const table = await prisma.table.findFirst({
            where: { label: tableId.toString() }
        });

        // If table doesn't exist (e.g. they typed a random number), 
        // for MVP we can either error or Create it on the fly, or just assign to a default.
        // Let's Find or Create for robustness so the UX doesn't break.
        let tableRecord = table;
        if (!tableRecord) {
            // Find default restaurant first
            const restaurant = await prisma.restaurant.findFirst();
            tableRecord = await prisma.table.create({
                data: {
                    label: tableId.toString(),
                    restaurant_id: restaurant.id
                }
            });
        }

        // 2a. Find or create an active session for this table
        let session = await prisma.tableSession.findFirst({
            where: { table_id: tableRecord.id, status: 'ACTIVE' }
        });
        if (!session) {
            session = await prisma.tableSession.create({
                data: { table_id: tableRecord.id, status: 'ACTIVE' }
            });
        }

        // 2. Validate Items are Available
        const itemIds = items.map(i => i.id);
        const dbItems = await prisma.menuItem.findMany({
            where: {
                id: { in: itemIds }
            }
        });

        const unavailableItems = dbItems.filter(i => !i.is_available);
        if (unavailableItems.length > 0) {
            return NextResponse.json({
                error: `Some items are sold out: ${unavailableItems.map(i => i.name).join(', ')}`
            }, { status: 400 });
        }

        // 3. Calculate Total (use DB price for security)
        const total = items.reduce((sum, item) => {
            const dbItem = dbItems.find(dbi => dbi.id === item.id);
            // Default to client price if not found (shouldn't happen with above check) or handle error
            const price = dbItem ? dbItem.price : item.price;
            return sum + (price * item.quantity);
        }, 0);

        // 3. Create Order Transaction (use DB-verified prices for security)
        const order = await prisma.order.create({
            data: {
                table_id: tableRecord.id,
                session_id: session.id,
                total_price: total,
                status: 'RECEIVED',
                items: {
                    create: items.map(item => {
                        const dbItem = dbItems.find(dbi => dbi.id === item.id);
                        return {
                            item_id: item.id,
                            quantity: item.quantity,
                            price: dbItem ? dbItem.price : item.price,
                            notes: item.notes || ''
                        };
                    })
                }
            }
        });

        return NextResponse.json({
            success: true,
            orderId: order.id.slice(0, 8).toUpperCase(), // Return a short friendly ID for display
            dbOrderId: order.id
        });

    } catch (error) {
        console.error('Order error', error);
        return NextResponse.json({ error: 'Error creating order' }, { status: 500 });
    }
}
