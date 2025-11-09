import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../services/prisma';
import {
  createPumpSchema,
  updatePumpSchema,
  CreatePumpInput,
  UpdatePumpInput,
} from '../types/schemas';

/**
 * Get pumps for a station
 */
export async function getPumpsByStation(
  request: FastifyRequest<{ Params: { stationId: string } }>,
  reply: FastifyReply
) {
  try {
    const stationId = parseInt(request.params.stationId);

    const pumps = await prisma.pump.findMany({
      where: { stationId },
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
      orderBy: { pumpNumber: 'asc' },
    });

    const data = pumps.map((pump) => ({
      id: pump.id,
      stationId: pump.stationId,
      stationName: pump.station.name,
      pumpNumber: pump.pumpNumber,
      mainRfidTag: pump.mainRfidTag,
      status: pump.status,
      expectedChildTags: pump.expectedChildTags.map((tag) => tag.tagId),
      createdAt: pump.createdAt,
      updatedAt: pump.updatedAt,
    }));

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

/**
 * Get single pump
 */
export async function getPump(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const id = parseInt(request.params.id);

    const pump = await prisma.pump.findUnique({
      where: { id },
      include: {
        station: {
          select: {
            name: true,
          },
        },
        expectedChildTags: {
          where: { isActive: true },
        },
        verificationSessions: {
          take: 1,
          orderBy: { timestamp: 'desc' },
          include: {
            user: {
              select: {
                username: true,
              },
            },
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

    const data = {
      id: pump.id,
      stationId: pump.stationId,
      stationName: pump.station.name,
      pumpNumber: pump.pumpNumber,
      mainRfidTag: pump.mainRfidTag,
      status: pump.status,
      expectedChildTags: pump.expectedChildTags.map((tag) => ({
        id: tag.id,
        tagId: tag.tagId,
        description: tag.description,
        isActive: tag.isActive,
      })),
      lastVerification: pump.verificationSessions[0] || null,
      createdAt: pump.createdAt,
      updatedAt: pump.updatedAt,
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

/**
 * Create pump (admin only)
 */
export async function createPump(
  request: FastifyRequest<{ Params: { stationId: string } }>,
  reply: FastifyReply
) {
  try {
    const stationId = parseInt(request.params.stationId);
    const body = createPumpSchema.parse(request.body);

    // Check if station exists
    const station = await prisma.gasStation.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Gas station not found',
        },
      });
    }

    // Check if pump number already exists for this station
    const existingPump = await prisma.pump.findFirst({
      where: {
        stationId,
        pumpNumber: body.pumpNumber,
      },
    });

    if (existingPump) {
      return reply.status(409).send({
        success: false,
        error: {
          code: 'DUPLICATE_RESOURCE',
          message: `Pump number ${body.pumpNumber} already exists for this station`,
        },
      });
    }

    // Check if main RFID tag is already in use
    const existingTag = await prisma.pump.findUnique({
      where: { mainRfidTag: body.mainRfidTag },
    });

    if (existingTag) {
      return reply.status(409).send({
        success: false,
        error: {
          code: 'DUPLICATE_RESOURCE',
          message: `Main RFID tag '${body.mainRfidTag}' is already in use`,
        },
      });
    }

    // Create pump with expected child tags
    const pump = await prisma.pump.create({
      data: {
        stationId,
        pumpNumber: body.pumpNumber,
        mainRfidTag: body.mainRfidTag,
        status: 'LOCKED',
        expectedChildTags: {
          create: body.expectedChildTags.map((tag) => ({
            tagId: tag.tagId,
            description: tag.description,
          })),
        },
      },
      include: {
        expectedChildTags: true,
      },
    });

    const data = {
      ...pump,
      expectedChildTags: pump.expectedChildTags.map((tag) => tag.tagId),
    };

    return reply.status(201).send({
      success: true,
      data,
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
        message: 'An error occurred',
      },
    });
  }
}

/**
 * Update pump (admin only)
 */
export async function updatePump(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const id = parseInt(request.params.id);
    const body = updatePumpSchema.parse(request.body);

    const pump = await prisma.pump.update({
      where: { id },
      data: body,
    });

    return reply.status(200).send({
      success: true,
      data: pump,
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

    if (error.code === 'P2025') {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Pump not found',
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
 * Delete pump (admin only)
 */
export async function deletePump(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const id = parseInt(request.params.id);

    await prisma.pump.delete({
      where: { id },
    });

    return reply.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Pump not found',
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
