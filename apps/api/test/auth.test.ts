import { beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { before } from 'node:test';

describe('auth', () => {
    beforeEach(async () => {
        await prisma.application.deleteMany();
        await prisma.job.deleteMany();
        await prisma.refreshToken.deleteMany();
        await prisma.user.deleteMany();
    });

    it('registers and logs in an employer', async () => {
        const app = await buildApp();

        const reg = await app.inject({
            method: 'POST',
            url: 'auth/register',
            payload: {
                email: 'boss@example.com',
                password: 'password123',
                role: 'employer',
            },
        });
        expect(reg.statusCode).toBe(201);

        const login = await app.inject({
            method: 'POST',
            url: 'auth/login',
            payload: {
                email: 'boss@example.com',
                password: 'password123',
            },
        });
        expect(login.statusCode).toBe(200);

        const body = login.json();
        expect(body.accessToken).toBeTypeOf('string');
        expect(login.cookies.some((c) => c.name === 'refresh token')).toBe(true);

        await app.close();
    });
});