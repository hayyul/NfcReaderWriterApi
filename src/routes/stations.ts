import { FastifyInstance } from 'fastify';
import {
  getAllStations,
  getStation,
  createStation,
  updateStation,
  deleteStation,
} from '../controllers/stationController';
import { authenticate, requireAdmin } from '../middleware/auth';

export default async function stationRoutes(server: FastifyInstance) {
  // GET /api/v1/stations
  server.get('/', { preHandler: [authenticate] }, getAllStations);

  // GET /api/v1/stations/:id
  server.get('/:id', { preHandler: [authenticate] }, getStation);

  // POST /api/v1/stations (admin only)
  server.post('/', { preHandler: [requireAdmin] }, createStation);

  // PUT /api/v1/stations/:id (admin only)
  server.put('/:id', { preHandler: [requireAdmin] }, updateStation);

  // DELETE /api/v1/stations/:id (admin only)
  server.delete('/:id', { preHandler: [requireAdmin] }, deleteStation);
}
