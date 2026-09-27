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
        expect(login.cookies.some((c) => c.name === 'refresh_token')).toBe(true);

        await app.close();
    });

    it('refreshed acess token from cookie', async () => {
        const app = await buildApp();
        console.log('app:', app);
        await app.inject({
            method: 'POST',
            url: '/auth/register',
            payload: {
                email: 'boss@example.com',
                password: 'password123',
                role: 'employer',
              },
        });

        const login = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { email: 'boss@example.com', password: 'password123' },
        });
        const refreshCookie = login.cookies.find((c) => c.name === 'refresh_token');
        expect(refreshCookie).toBeDefined();

        const refresh = await app.inject({
            method: 'POST',
            url: '/auth/refresh',
            cookies: { refresh_token: refreshCookie!.value },
        });
        expect(refresh.statusCode).toBe(200);
        expect(refresh.json().accessToken).toBeTypeOf('string');
        await app.close();
    });
    it('rejects refresh after logout', async () => {
        const app = await buildApp();
        await app.inject({
          method: 'POST',
          url: '/auth/register',
          payload: {
            email: 'boss@example.com',
            password: 'password123',
            role: 'employer',
          },
        });
        const login = await app.inject({
          method: 'POST',
          url: '/auth/login',
          payload: { email: 'boss@example.com', password: 'password123' },
        });
        const refreshCookie = login.cookies.find((c) => c.name === 'refresh_token')!;
        const logout = await app.inject({
          method: 'POST',
          url: '/auth/logout',
          cookies: { refresh_token: refreshCookie.value },
        });
        expect(logout.statusCode).toBe(204);
        const refresh = await app.inject({
          method: 'POST',
          url: '/auth/refresh',
          cookies: { refresh_token: refreshCookie.value },
        });
        expect(refresh.statusCode).toBe(401);
        await app.close();
      });
});