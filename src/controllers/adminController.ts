import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../services/prisma';

/**
 * Get dashboard analytics
 * GET /api/v1/admin/analytics
 */
export async function getAnalytics(request: FastifyRequest, reply: FastifyReply) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Run queries in parallel
    const [
      totalStations,
      totalPumps,
      activeStations,
      verificationsTodayCount,
      verificationsWeekCount,
      failedVerificationsWeek,
      successfulVerificationsWeek,
    ] = await Promise.all([
      prisma.gasStation.count(),
      prisma.pump.count(),
      prisma.gasStation.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.verificationSession.count({
        where: {
          timestamp: { gte: today },
        },
      }),
      prisma.verificationSession.count({
        where: {
          timestamp: { gte: weekAgo },
        },
      }),
      prisma.verificationSession.count({
        where: {
          timestamp: { gte: weekAgo },
          verificationResult: 'FAILED',
        },
      }),
      prisma.verificationSession.count({
        where: {
          timestamp: { gte: weekAgo },
          verificationResult: 'SUCCESS',
        },
      }),
    ]);

    // Calculate success rate
    const successRate =
      verificationsWeekCount > 0
        ? (successfulVerificationsWeek / verificationsWeekCount) * 100
        : 0;

    reply.send({
      success: true,
      data: {
        totalStations,
        totalPumps,
        activeStations,
        verificationsTodayCount,
        verificationsWeekCount,
        failedVerificationsWeek,
        successRate: parseFloat(successRate.toFixed(2)),
      },
    });
  } catch (error: any) {
    request.log.error(error);
    reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
}

/**
 * Get audit logs
 * GET /api/v1/admin/audit-logs
 */
export async function getAuditLogs(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as any;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query.action) {
      where.action = query.action;
    }

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    if (query.userId) {
      where.userId = parseInt(query.userId);
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    // Get logs with user info
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    // Get total count
    const total = await prisma.auditLog.count({ where });

    reply.send({
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        userName: log.user.fullName || log.user.username,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        oldValues: log.oldValues,
        newValues: log.newValues,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    request.log.error(error);
    reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
}

/**
 * Get all verifications across all stations
 * GET /api/v1/admin/verifications/all
 */
export async function getAllVerifications(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const query = request.query as any;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query.result) {
      where.verificationResult = query.result.toUpperCase();
    }

    if (query.stationId) {
      where.pump = {
        stationId: parseInt(query.stationId),
      };
    }

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) {
        where.timestamp.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.timestamp.lte = new Date(query.endDate);
      }
    }

    // Get verifications with related data
    const verifications = await prisma.verificationSession.findMany({
      where,
      include: {
        pump: {
          include: {
            station: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        scannedChildTags: {
          orderBy: {
            scanOrder: 'asc',
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip: offset,
      take: limit,
    });

    // Get total count
    const total = await prisma.verificationSession.count({ where });

    reply.send({
      success: true,
      data: verifications.map((verification) => {
        // Separate scanned tags into expected and unexpected
        const scannedTags = verification.scannedChildTags;
        const missingTags = scannedTags
          .filter((tag) => !tag.isExpected)
          .map((tag) => tag.tagId);
        const unexpectedTags = scannedTags
          .filter((tag) => !tag.isExpected)
          .map((tag) => tag.tagId);

        // Calculate expected count (we need to query this separately for accuracy)
        // For now, use totalScanned - unexpectedTagsCount + missingTagsCount
        const expectedCount =
          verification.totalScanned -
          verification.unexpectedTagsCount +
          verification.missingTagsCount;

        return {
          sessionId: verification.id,
          pumpId: verification.pumpId,
          pumpNumber: verification.pump.pumpNumber,
          stationId: verification.pump.stationId,
          stationName: verification.pump.station.name,
          userId: verification.userId,
          userName: verification.user
            ? verification.user.fullName || verification.user.username
            : null,
          result: verification.verificationResult,
          message: verification.resultMessage,
          details: {
            expectedCount,
            scannedCount: verification.totalScanned,
            missingTags: [], // Tags that were expected but not scanned
            unexpectedTags, // Tags that were scanned but not expected
          },
          pumpStatus: verification.pump.status,
          timestamp: verification.timestamp,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    request.log.error(error);
    reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
}

/**
 * Get station activity logs
 * GET /api/v1/admin/stations/:id/logs
 */
export async function getStationLogs(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string };
    const stationId = parseInt(id);

    // Get station info
    const station = await prisma.gasStation.findUnique({
      where: { id: stationId },
      include: {
        lastModifier: {
          select: {
            fullName: true,
            username: true,
          },
        },
      },
    });

    if (!station) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'STATION_NOT_FOUND',
          message: 'Station not found',
        },
      });
    }

    // Get audit logs for this station
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: 'STATION',
        entityId: stationId,
      },
      include: {
        user: {
          select: {
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Last 100 logs
    });

    reply.send({
      success: true,
      data: {
        stationId: station.id,
        stationName: station.name,
        lastModifiedAt: station.updatedAt,
        lastModifiedBy: station.lastModifier
          ? station.lastModifier.fullName || station.lastModifier.username
          : null,
        lastVerificationAt: station.lastVerificationAt,
        logs: logs.map((log) => ({
          id: log.id,
          action: log.action,
          oldValues: log.oldValues,
          newValues: log.newValues,
          modifiedBy: log.user.fullName || log.user.username,
          modifiedAt: log.createdAt,
          ipAddress: log.ipAddress,
        })),
      },
    });
  } catch (error: any) {
    request.log.error(error);
    reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
}
