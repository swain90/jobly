import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { StringValidation } from 'zod/v3';

export type AccessPayload = {
    sub: string;
    role: 'employer' | 'applicant';
};

function getSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not set');
    return new TextEncoder().encode(secret);
}

export async function signAccessToken(payload: AccessPayload): Promise<string> {
    return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getSecret());
}

export async function verfiyAccessToken(token: string): Promise<AccessPayload> {
    const { payload } = await jwtVerify(token, getSecret());
    return {
        sub: payload.sub as string,
        role: payload.role as 'employer' | 'applicant',
    };
}

export function hashRefreshToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
}

export function createRefreshToken(): {
    raw: string;
    hash: string;
    expiresAt: Date;
} {
    const raw = randomBytes(32).toString('hex');
    const hash = hashRefreshToken(raw);
    const expiresAt = new Date(Date.now()+ 7 * 24 * 60 * 60 * 1000);
    return { raw, hash, expiresAt };
}