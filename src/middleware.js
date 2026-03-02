import { NextResponse } from 'next/server';

export function middleware(request) {
    // Only protect /admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {

        // Exclude the login page itself to prevent infinite loop
        if (request.nextUrl.pathname === '/admin/login') {
            return NextResponse.next();
        }

        // Check for auth cookie
        const token = request.cookies.get('admin_token');

        if (!token) {
            // Redirect to login if no token
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
};
