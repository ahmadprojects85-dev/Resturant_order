import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

// Helper to get secret key for jose
const getJwtSecretKey = () => {
    const secret = process.env.JWT_SECRET_KEY || 'dev-secret-key-change-this-in-prod';
    return new TextEncoder().encode(secret);
};

export async function middleware(request) {
    const response = NextResponse.next();

    // 🛡️ A06: Implement Enterprise-Grade Security Headers
    const headers = response.headers;
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    headers.set('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https://api.push.apple.com https://updates.push.services.mozilla.com https://android.googleapis.com https://fcm.googleapis.com; " +
        "frame-ancestors 'none';"
    );

    // 🏁 A01: Edge-level Authorization Protection for Admin Routes (BYPASSED)
    if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api/admin')) {
        // AUTOMATIC BYPASS: Create a valid token instantly
        const token = await new SignJWT({ id: 'bypass_admin_id', username: 'admin', role: 'ADMIN' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(getJwtSecretKey());

        // 1. Tell Next.js API Routes down the line that the cookie exists
        request.cookies.set('auth_token', token);
        const newResponse = NextResponse.next({ request });
        
        // 2. Give the cookie to the browser forever
        newResponse.cookies.set('auth_token', token, { path: '/', maxAge: 60*60*24 });
        
        return newResponse;
    }

    return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
