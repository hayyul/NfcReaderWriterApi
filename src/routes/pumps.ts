import { FastifyInstance } from 'fastify';
import {
  getAllPumps,
  getPumpsByStation,
  getPump,
  createPump,
  updatePump,
  deletePump,
} from '../controllers/pumpController';
import { authenticate, requireAdmin } from '../middleware/auth';

export default async function pumpRoutes(server: FastifyInstance) {
  // GET /api/v1/pumps - Get all pumps across all stations
  server.get('/', { preHandler: [authenticate] }, getAllPumps);

  // GET /api/v1/pumps/:id
  server.get('/:id', { preHandler: [authenticate] }, getPump);

  // PUT /api/v1/pumps/:id (admin only)
  server.put('/:id', { preHandler: [requireAdmin] }, updatePump);

  // DELETE /api/v1/pumps/:id (admin only)
  server.delete('/:id', { preHandler: [requireAdmin] }, deletePump);
}

// Station-specific pump routes will be in stations router
export async function stationPumpRoutes(server: FastifyInstance) {
  // GET /api/v1/stations/:stationId/pumps
  server.get('/', { preHandler: [authenticate] }, getPumpsByStation);

  // POST /api/v1/stations/:stationId/pumps (admin only)
  server.post('/', { preHandler: [requireAdmin] }, createPump);
}
