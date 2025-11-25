import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getAnalytics,
  getAuditLogs,
  getAllVerifications,
  getStationLogs,
} from '../controllers/adminController';

export default async function adminRoutes(fastify: FastifyInstance) {
  // All routes require authentication and admin role
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireAdmin);

  /**
   * @route GET /api/v1/admin/analytics
   * @desc Get dashboard analytics and statistics
   * @access Admin, Super Admin
   */
  fastify.get('/analytics', getAnalytics);

  /**
   * @route GET /api/v1/admin/audit-logs
   * @desc Get audit logs with filtering
   * @query page - Page number (default: 1)
   * @query limit - Results per page (default: 50)
   * @query action - Filter by action (CREATE, UPDATE, DELETE)
   * @query entityType - Filter by entity type (STATION, PUMP, USER, VERIFICATION)
   * @query userId - Filter by user ID
   * @query startDate - Filter from date (ISO format)
   * @query endDate - Filter to date (ISO format)
   * @access Admin, Super Admin
   */
  fastify.get('/audit-logs', getAuditLogs);

  /**
   * @route GET /api/v1/admin/verifications/all
   * @desc Get all verifications across all stations
   * @query page - Page number (default: 1)
   * @query limit - Results per page (default: 50)
   * @query result - Filter by result (success, failed)
   * @query stationId - Filter by station ID
   * @query startDate - Filter from date (ISO format)
   * @query endDate - Filter to date (ISO format)
   * @access Admin, Super Admin
   */
  fastify.get('/verifications/all', getAllVerifications);

  /**
   * @route GET /api/v1/admin/stations/:id/logs
   * @desc Get station activity logs and modification history
   * @params id - Station ID
   * @access Admin, Super Admin
   */
  fastify.get('/stations/:id/logs', getStationLogs);
}
