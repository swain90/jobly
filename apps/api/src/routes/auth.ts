import type { FastifyInstance } from "fastify";
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { sendError } from "../lib/errors.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { createRefreshToken, signAccessToken, } from '../lib/tokens.js';

const registerBody = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['employer', 'applicant']),
});

const loginBody = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

export async function authRoutes(app: FastifyInstance) {
    app.post('/auth/register', async (request, reply) => {
        const parsed = registerBody.safeParse(request.body);
        if (!parsed.success) {
            return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid body')
        }

        const { email, password, role } = parsed.data;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return sendError(reply, 409, 'EMAIL_TAKEN', 'Email already registered')
        }

        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
            data: {email, passwordHash, role}
        });

        return reply.status(201).send({
            user: { id: user.id, email: user.email, role: user.role },
        });       
    });
    app.post('/auth/login', async (request, reply) => {
        const parsed = loginBody.safeParse(request.body);
        if (!parsed.success) {
            return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid body credentials')
        }
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email }});
        if (!user || !(await verifyPassword(password, user.passwordHash))) {
            return sendError(reply, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        }

        const accessToken = await signAccessToken({
            sub: user.id,
            role: user.role,
        });
        const refresh = createRefreshToken();

        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: refresh.hash,
                expiresAt: refresh.expiresAt,
            },
        });

        reply.setCookie('refresh_token', refresh.raw, {
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
            secure: process.env.COOKIE_SECURE === 'true',
            expires: refresh.expiresAt,
        });

        return reply.send({
            accessToken,
            user: {
                id: user.id,
                email:user.email,
                role: user.role
            }
        });

    });
}