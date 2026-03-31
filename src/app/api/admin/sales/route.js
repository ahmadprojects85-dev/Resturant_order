import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Helper to check auth
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
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date'); // Expected: YYYY-MM-DD

        // Default to today if no date provided
        const targetDate = dateParam ? new Date(dateParam) : new Date();

        // Create date range for the entire day
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Calculate previous day for comparison
        const prevDayStart = new Date(startOfDay);
        prevDayStart.setDate(prevDayStart.getDate() - 1);
        const prevDayEnd = new Date(endOfDay);
        prevDayEnd.setDate(prevDayEnd.getDate() - 1);

        // Fetch ALL data in a single parallel batch to minimize round-trips to remote DB
        const [orders, prevOrders, historicalOrders, sessions] = await Promise.all([
            prisma.order.findMany({
                where: {
                    created_at: { gte: startOfDay, lte: endOfDay },
                    status: { not: 'CANCELLED' }
                },
                include: { items: { include: { item: true } }, table: true },
                orderBy: { created_at: 'desc' }
            }),
            prisma.order.findMany({
                where: {
                    created_at: { gte: prevDayStart, lte: prevDayEnd },
                    status: { not: 'CANCELLED' }
                },
                select: { total_price: true }
            }),
            prisma.order.findMany({
                where: {
                    created_at: {
                        gte: new Date(new Date().setDate(new Date().getDate() - 7))
                    },
                    status: { not: 'CANCELLED' }
                },
                select: { created_at: true }
            }),
            prisma.tableSession.findMany({
                where: { started_at: { gte: startOfDay, lte: endOfDay } },
                select: { table_id: true, table: { select: { label: true } } }
            })
        ]);

        // Calculate current stats
        const totalRevenue = orders.reduce((sum, order) => sum + order.total_price, 0);
        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.status === 'COMPLETED' || o.status === 'READY').length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Calculate previous stats for comparison
        const prevRevenue = prevOrders.reduce((sum, order) => sum + order.total_price, 0);
        const prevTotalOrders = prevOrders.length;
        const prevAvgOrderValue = prevTotalOrders > 0 ? prevRevenue / prevTotalOrders : 0;

        // Calculate trends (percentage changes)
        const calculateTrend = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        const trends = {
            revenue: calculateTrend(totalRevenue, prevRevenue),
            orders: calculateTrend(totalOrders, prevTotalOrders),
            avgOrder: calculateTrend(avgOrderValue, prevAvgOrderValue)
        };

        // Group items sold and categories
        const itemsSold = {};
        const categoriesBreakdown = {};

        const tableRevenue = {};
        const sessionCounts = {};

        sessions.forEach(s => {
            const label = s.table?.label || 'Unknown';
            sessionCounts[label] = (sessionCounts[label] || 0) + 1;
        });

        orders.forEach(order => {
            const tableLabel = order.table?.label || 'Unknown';
            tableRevenue[tableLabel] = (tableRevenue[tableLabel] || 0) + order.total_price;

            order.items.forEach(orderItem => {
                const itemId = orderItem.item_id;
                const categoryId = orderItem.item?.category_id || 'uncategorized';
                const categoryName = orderItem.item?.category?.name || 'Uncategorized';

                if (!itemsSold[itemId]) {
                    itemsSold[itemId] = {
                        id: itemId,
                        name: orderItem.item?.name || 'Unknown Item',
                        category: categoryName,
                        quantity: 0,
                        revenue: 0
                    };
                }
                itemsSold[itemId].quantity += orderItem.quantity;
                itemsSold[itemId].revenue += orderItem.price * orderItem.quantity;

                if (!categoriesBreakdown[categoryId]) {
                    categoriesBreakdown[categoryId] = {
                        id: categoryId,
                        name: categoryName,
                        revenue: 0,
                        quantity: 0
                    };
                }
                categoriesBreakdown[categoryId].revenue += orderItem.price * orderItem.quantity;
                categoriesBreakdown[categoryId].quantity += orderItem.quantity;
            });
        });

        const itemsArray = Object.values(itemsSold).sort((a, b) => b.revenue - a.revenue);
        const categoriesArray = Object.values(categoriesBreakdown).sort((a, b) => b.revenue - a.revenue);

        // Final Top Tables - Ranked by Session Count, with revenue as fallback
        const topTables = Object.keys({ ...tableRevenue, ...sessionCounts })
            .map(label => ({
                label,
                sessionCount: sessionCounts[label] || 0,
                revenue: tableRevenue[label] || 0
            }))
            .sort((a, b) => b.sessionCount - a.sessionCount || b.revenue - a.revenue)
            .slice(0, 5);

        return NextResponse.json({
            date: targetDate.toISOString().split('T')[0],
            summary: {
                totalRevenue,
                totalOrders,
                completedOrders,
                averageOrderValue: avgOrderValue,
                busiestHour: calculateBusiestHour(orders),
                predictedPeakHour: calculateBusiestHour(historicalOrders), // Use 7-day data for prediction
                bestCategory: categoriesArray[0]?.name || 'N/A',
                topTables,
                trends
            },
            items: itemsArray,
            categories: categoriesArray,
            orders: orders.map(o => ({
                id: o.id,
                shortId: o.id.slice(0, 8).toUpperCase(),
                table: o.table?.label || 'Unknown',
                sessionId: o.session_id,
                total: o.total_price,
                status: o.status,
                time: o.created_at,
                itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
                items: o.items.map(oi => ({
                    name: oi.item?.name || 'Unknown',
                    quantity: oi.quantity,
                    price: oi.price
                }))
            }))
        });
    } catch (error) {
        console.error('Sales API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch sales data' }, { status: 500 });
    }
}

function calculateBusiestHour(orders) {
    if (!orders || orders.length === 0) return 'N/A';
    const hours = {};
    orders.forEach(o => {
        const timeVal = o.time || o.created_at;
        if (!timeVal) return;
        const h = new Date(timeVal).getHours();
        hours[h] = (hours[h] || 0) + 1;
    });
    const entries = Object.entries(hours);
    if (entries.length === 0) return 'N/A';
    const busiest = entries.sort((a, b) => b[1] - a[1])[0][0];
    const hour = parseInt(busiest);
    const displayHour = hour % 12 || 12;
    const ampm = hour < 12 ? 'am' : 'pm';
    return `${displayHour}${ampm}`;
}
