import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../services/prisma';
import {
  verifyRfidSchema,
  verificationQuerySchema,
  VerifyRfidInput,
  VerificationQuery,
} from '../types/schemas';

/**
 * Verify RFID tags for a pump
 */
export async function verifyRfidTags(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const pumpId = parseInt(request.params.id);
    const body = verifyRfidSchema.parse(request.body);
    const user = request.user as any;

    // Get pump with expected tags
    const pump = await prisma.pump.findUnique({
      where: { id: pumpId },
      include: {
        expectedChildTags: {
          where: { isActive: true },
        },
        station: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!pump) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Pump not found',
        },
      });
    }

    // Verify main tag matches
    if (pump.mainRfidTag !== body.mainTagScanned) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'MAIN_TAG_MISMATCH',
          message: `Main tag '${body.mainTagScanned}' does not match pump's main tag '${pump.mainRfidTag}'`,
        },
      });
    }

    // Get expected tags
    const expectedTags = new Set(pump.expectedChildTags.map((tag) => tag.tagId));
    const scannedTags = new Set(body.scannedChildTags);

    // Find missing tags (expected but not scanned)
    const missingTags = Array.from(expectedTags).filter((tag) => !scannedTags.has(tag));

    // Find unexpected tags (scanned but not expected)
    const unexpectedTags = body.scannedChildTags.filter((tag) => !expectedTags.has(tag));

    // Determine verification result
    const isSuccess = missingTags.length === 0 && unexpectedTags.length === 0;
    const verificationResult = isSuccess ? 'SUCCESS' : 'FAILED';

    // Build result message
    let message = '';
    if (isSuccess) {
      message = 'All RFID tags verified successfully. Pump is secure.';
    } else {
      const issues: string[] = [];
      if (missingTags.length > 0) {
        issues.push(`${missingTags.length} tag(s) missing or broken`);
      }
      if (unexpectedTags.length > 0) {
        issues.push(`${unexpectedTags.length} unexpected tag(s) detected`);
      }
      message = `ALERT: ${issues.join(', ')}. Pump may have been tampered with!`;
    }

    // Update pump status if verification failed
    if (!isSuccess && pump.status === 'LOCKED') {
      await prisma.pump.update({
        where: { id: pumpId },
        data: { status: 'BROKEN' },
      });
    }

    // Create verification session
    const session = await prisma.verificationSession.create({
      data: {
        pumpId,
        userId: user?.userId || null,
        mainTagScanned: body.mainTagScanned,
        verificationResult,
        missingTagsCount: missingTags.length,
        unexpectedTagsCount: unexpectedTags.length,
        totalScanned: body.scannedChildTags.length,
        resultMessage: message,
        scannedChildTags: {
          create: body.scannedChildTags.map((tag, index) => ({
            tagId: tag,
            scanOrder: index + 1,
            isExpected: expectedTags.has(tag),
          })),
        },
      },
      include: {
        scannedChildTags: true,
      },
    });

    const responseData = {
      sessionId: session.id,
      result: verificationResult.toLowerCase(),
      message,
      details: {
        expectedCount: expectedTags.size,
        scannedCount: body.scannedChildTags.length,
        missingTags,
        unexpectedTags,
      },
      pumpStatus: !isSuccess && pump.status === 'LOCKED' ? 'BROKEN' : pump.status,
      timestamp: session.timestamp,
    };

    return reply.status(200).send({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        },
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred during verification',
      },
    });
  }
}

/**
 * Get verification history for a pump
 */
export async function getPumpVerifications(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const pumpId = parseInt(request.params.id);
    const query = verificationQuerySchema.parse(request.query);
    const { page, limit, result, startDate, endDate } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { pumpId };
    if (result && result !== 'all') {
      where.verificationResult = result;
    }
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    // Get verifications
    const [verifications, total] = await Promise.all([
      prisma.verificationSession.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.verificationSession.count({ where }),
    ]);

    const data = verifications.map((v) => ({
      sessionId: v.id,
      pumpId: v.pumpId,
      userId: v.userId,
      username: v.user?.username || null,
      mainTagScanned: v.mainTagScanned,
      result: v.verificationResult.toLowerCase(),
      missingTagsCount: v.missingTagsCount,
      unexpectedTagsCount: v.unexpectedTagsCount,
      totalScanned: v.totalScanned,
      message: v.resultMessage,
      timestamp: v.timestamp,
    }));

    return reply.status(200).send({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
        },
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred',
      },
    });
  }
}

/**
 * Get single verification session details
 */
export async function getVerificationSession(
  request: FastifyRequest<{ Params: { sessionId: string } }>,
  reply: FastifyReply
) {
  try {
    const sessionId = parseInt(request.params.sessionId);

    const session = await prisma.verificationSession.findUnique({
      where: { id: sessionId },
      include: {
        pump: {
          include: {
            station: {
              select: {
                name: true,
              },
            },
            expectedChildTags: {
              where: { isActive: true },
            },
          },
        },
        user: {
          select: {
            username: true,
            fullName: true,
          },
        },
        scannedChildTags: {
          orderBy: { scanOrder: 'asc' },
        },
      },
    });

    if (!session) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Verification session not found',
        },
      });
    }

    const expectedTags = session.pump.expectedChildTags.map((tag) => tag.tagId);
    const scannedTags = session.scannedChildTags.map((tag) => tag.tagId);
    const missingTags = expectedTags.filter((tag) => !scannedTags.includes(tag));
    const unexpectedTags = session.scannedChildTags
      .filter((tag) => !tag.isExpected)
      .map((tag) => tag.tagId);

    const data = {
      sessionId: session.id,
      pumpId: session.pumpId,
      pumpNumber: session.pump.pumpNumber,
      stationId: session.pump.stationId,
      stationName: session.pump.station.name,
      userId: session.userId,
      username: session.user?.username || null,
      userFullName: session.user?.fullName || null,
      mainTagScanned: session.mainTagScanned,
      result: session.verificationResult.toLowerCase(),
      message: session.resultMessage,
      expectedTags,
      scannedTags: session.scannedChildTags.map((tag) => ({
        tagId: tag.tagId,
        scanOrder: tag.scanOrder,
        isExpected: tag.isExpected,
      })),
      missingTags,
      unexpectedTags,
      timestamp: session.timestamp,
    };

    return reply.status(200).send({
      success: true,
      data,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred',
      },
    });
  }
}
