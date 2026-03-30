import { NextResponse } from 'next/server';

export async function POST() {
    // Return a success response and delete the auth_token cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth_token');
    return response;
}
