import { FastifyInstance } from 'fastify';
import { login, logout, me } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

export default async function authRoutes(server: FastifyInstance) {
  // POST /api/v1/auth/login
  server.post('/login', login);

  // POST /api/v1/auth/logout (authenticated)
  server.post('/logout', { preHandler: [authenticate] }, logout);

  // GET /api/v1/auth/me (authenticated)
  server.get('/me', { preHandler: [authenticate] }, me);
}
