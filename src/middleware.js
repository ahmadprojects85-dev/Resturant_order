import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Helper to get secret key for jose
const getJwtSecretKey = () => {
    const secret = process.env.JWT_SECRET_KEY || 'dev-secret-key-change-this-in-prod';
    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET_KEY is missing in production!');
    }
    return new TextEncoder().encode(secret);
};

export async function middleware(request) {
    const response = NextResponse.next();

    // 🛡️ A06: Implement Enterprise-Grade Security Headers
    const headers = response.headers;
    
    // 1. Prevent Clickjacking
    headers.set('X-Frame-Options', 'DENY');
    
    // 2. Prevent MIME type sniffing
    headers.set('X-Content-Type-Options', 'nosniff');
    
    // 3. Referrer Policy
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // 4. HSTS (Enforce HTTPS) - Only in production
    if (process.env.NODE_ENV === 'production') {
        headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }

    // 5. Basic Content Security Policy (CSP)
    // In a real app, this should be more strict (nonce-based)
    // For now we allow images from any source and inline styles (common in MVP)
    headers.set('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // unsafe-inline often needed for Next.js hydrations
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https://api.push.apple.com https://updates.push.services.mozilla.com https://android.googleapis.com https://fcm.googleapis.com; " +
        "frame-ancestors 'none';"
    );

    // 🏁 A01: Edge-level Authorization Protection for Admin Routes
    if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api/admin')) {
        // Exempt login API from protection
        if (request.nextUrl.pathname === '/api/admin/login') {
            return response;
        }

        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            // If it's an API request, return 401
            if (request.nextUrl.pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
            }
            // If it's a page request, redirect to login
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        try {
            // Verify JWT Token at the Edge
            await jwtVerify(token, getJwtSecretKey());
            return response;
        } catch (error) {
            console.error('Middleware Auth Error:', error);
            // Delete the invalid token
            const redirectResponse = NextResponse.redirect(new URL('/admin/login', request.url));
            redirectResponse.cookies.delete('auth_token');
            
            if (request.nextUrl.pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
            }
            return redirectResponse;
        }
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
