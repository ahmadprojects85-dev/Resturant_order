import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const body = await request.json();
        const { password } = body;

        // Simple env-based auth for MVP
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

        if (password === ADMIN_PASSWORD) {
            // Set HttpOnly cookie
            const oneDay = 24 * 60 * 60 * 1000;
            const cookieStore = await cookies();
            cookieStore.set('admin_token', 'authenticated', {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                path: '/',
                maxAge: oneDay
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
