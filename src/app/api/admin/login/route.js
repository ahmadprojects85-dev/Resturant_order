import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

// 🛡️ A07: Simple Memory-based Rate Limiter for Login
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 mins
const MAX_ATTEMPTS = 5;

export async function POST(request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();
        
        // Clean up old entries
        const record = loginAttempts.get(ip);
        if (record && (now - record.startTime > RATE_LIMIT_WINDOW)) {
            loginAttempts.delete(ip);
        }

        const currentAttempts = loginAttempts.get(ip)?.count || 0;

        if (currentAttempts >= MAX_ATTEMPTS) {
            return NextResponse.json({ 
                error: 'Too many login attempts. Please try again in 15 minutes.' 
            }, { status: 429 });
        }

        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
        }

        const staff = await prisma.staff.findUnique({
            where: { username }
        });

        // 🛡️ A04: Prevent timing attacks by always performing a compare, even if user doesn't exist
        const dummyHash = '$2a$12$L8q2O5/u1YjV6Gv8A8uSDe5O8XJ8v8j8v8j8v8j8v8j8v8j8v8j8v'; // Random hash
        const isPasswordValid = await bcrypt.compare(password, staff ? staff.password : dummyHash);

        if (!staff || !isPasswordValid) {
            // Log failed attempt
            const newCount = currentAttempts + 1;
            loginAttempts.set(ip, { count: newCount, startTime: record?.startTime || now });
            
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Reset attempts on success
        loginAttempts.delete(ip);

        // Create JWT token
        const tokenPayload = {
            id: staff.id,
            username: staff.username,
            role: staff.role,
            name: staff.name
        };

        const token = await signToken(tokenPayload);

        // Set HttpOnly cookie
        const response = NextResponse.json({ success: true, user: tokenPayload });

        response.cookies.set({
            name: 'auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
