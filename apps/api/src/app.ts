import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';

export async function buildApp() {
    const app = Fastify({ logger: true});

    await app.register(cors, {
        origin: process.env.WEB_ORIGIN,
        credentials: true,
    });

    await app.register(cookie);

    app.get('/health', async () => ({ ok: true }));

    return app;

}