import type { FastifyReply } from 'fastify';

export function sendError(
  reply: FastifyReply,
  status: number,
  code: string,
  message: string,
) {
  return reply.status(status).send({ error: { code, message } });
}