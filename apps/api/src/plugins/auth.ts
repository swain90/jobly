import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { sendError } from '../lib/errors.js';
import { verifyAccessToken } from "../lib/tokens.js";

export type AuthUser = { id: String; role: 'employer' | 'applicant' };

declare module 'fastify' {
    interface FastifyRequest {
        user?: AuthUser;
    }
}

/** verify Bearer access JWT and attach `{id, role}` to the request. */
export async function authenticate(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    const header = request.headers.authorization;
    if(!header?.startsWith('Bearer ')) {
        return sendError(reply, 401, 'UNAUTHORIZED', 'Missing access token');
    }

    try {
        const payload = await verifyAccessToken(header.slice('Bearer '.length));
        request.user = { id: payload.sub, role: payload.role };
    } catch {
        return sendError(reply, 401, 'UNAUTHORIZED', 'Invalid access token');
    }
}

/** Return a preHandler that rejects callers without the required role. */
export function requireRole(role: 'employer' | 'applicant') {
    return async function requireRoleHandler(
      request: FastifyRequest,
      reply: FastifyReply,
    ) {
      if (!request.user) {
        return sendError(reply, 401, 'UNAUTHORIZED', 'Not authenticated');
      }
      if (request.user.role !== role) {
        return sendError(reply, 403, 'FORBIDDEN', 'Insufficient role');
      }
    };
  }