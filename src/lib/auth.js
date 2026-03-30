import { SignJWT, jwtVerify } from 'jose';

const getJwtSecretKey = () => {
    const secret = process.env.JWT_SECRET_KEY;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET_KEY is NOT defined in production environment!');
        }
        return new TextEncoder().encode('dev-secret-key-change-this-in-prod');
    }
    return new TextEncoder().encode(secret);
};

export async function signToken(payload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(getJwtSecretKey());
}

export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, getJwtSecretKey());
        return payload;
    } catch (error) {
        return null; // Invalid token
    }
}
