import { FastifyInstance } from 'fastify';
import {
  verifyRfidTags,
  getPumpVerifications,
  getVerificationSession,
} from '../controllers/verificationController';
import { authenticate } from '../middleware/auth';

export default async function verificationRoutes(server: FastifyInstance) {
  // GET /api/v1/verifications/:sessionId
  server.get('/:sessionId', { preHandler: [authenticate] }, getVerificationSession);
}

// Pump-specific verification routes
export async function pumpVerificationRoutes(server: FastifyInstance) {
  // POST /api/v1/pumps/:id/verify
  server.post('/', { preHandler: [authenticate] }, verifyRfidTags);

  // GET /api/v1/pumps/:id/verifications
  server.get('/', { preHandler: [authenticate] }, getPumpVerifications);
}
