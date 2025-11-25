import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Verify JWT token middleware
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    });
  }
}

/**
 * Check if user has admin role (includes SUPER_ADMIN)
 */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);

  const user = request.user as any;
  if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    reply.status(403).send({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Admin role required',
      },
    });
  }
}

/**
 * Check if user has super admin role
 */
export async function requireSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);

  const user = request.user as any;
  if (user?.role !== 'SUPER_ADMIN') {
    reply.status(403).send({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Super admin role required',
      },
    });
  }
}
