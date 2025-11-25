import { FastifyRequest, FastifyReply } from 'fastify';
import { AuditAction, AuditEntityType } from '@prisma/client';
import prisma from '../services/prisma';

export interface AuditLogOptions {
  entityType: AuditEntityType;
  getEntityId?: (request: FastifyRequest, data?: any) => number;
  getOldValues?: (request: FastifyRequest) => Promise<any>;
}

/**
 * Audit logging middleware that tracks all modifications
 */
export function auditLogger(options: AuditLogOptions) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { entityType, getEntityId, getOldValues } = options;

    // Store original send method
    const originalSend = reply.send.bind(reply);

    // Override send to capture response
    reply.send = function (data: any) {
      // Only log successful modifications
      if (
        data?.success &&
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
      ) {
        // Log async without blocking response
        (async () => {
          try {
            const user = request.user as any;
            if (!user?.id) return;

            // Determine action based on HTTP method
            let action: AuditAction;
            if (request.method === 'POST') action = 'CREATE';
            else if (request.method === 'DELETE') action = 'DELETE';
            else action = 'UPDATE';

            // Get entity ID
            let entityId: number;
            if (getEntityId) {
              entityId = getEntityId(request, data);
            } else {
              const params = request.params as { id?: string };
              entityId = data.data?.id || parseInt(params.id || '0');
            }

            // Get old values for updates
            let oldValues = null;
            if (action === 'UPDATE' && getOldValues) {
              oldValues = await getOldValues(request);
            }

            // Get new values
            const newValues = data.data || request.body;

            // Get IP address
            const ipAddress = request.ip || request.socket.remoteAddress;

            // Create audit log
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                action,
                entityType,
                entityId,
                oldValues: oldValues
                  ? JSON.parse(JSON.stringify(oldValues))
                  : null,
                newValues: newValues
                  ? JSON.parse(JSON.stringify(newValues))
                  : null,
                ipAddress,
              },
            });
          } catch (err) {
            // Log error but don't fail the request
            request.log.error({ err }, 'Audit logging failed');
          }
        })();
      }

      return originalSend(data);
    };
  };
}
