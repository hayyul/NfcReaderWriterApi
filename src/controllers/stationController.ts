import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../services/prisma';
import {
  createStationSchema,
  updateStationSchema,
  stationQuerySchema,
  CreateStationInput,
  UpdateStationInput,
  StationQuery,
} from '../types/schemas';

/**
 * Get all gas stations
 */
export async function getAllStations(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = stationQuerySchema.parse(request.query);
    const { page, limit, status, search } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get stations with pump count
    const [stations, total] = await Promise.all([
      prisma.gasStation.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { pumps: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.gasStation.count({ where }),
    ]);

    // Transform response
    const data = stations.map((station) => ({
      id: station.id,
      name: station.name,
      location: station.location,
      status: station.status,
      pumpCount: station._count.pumps,
      createdAt: station.createdAt,
      updatedAt: station.updatedAt,
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
 * Get single gas station
 */
export async function getStation(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const id = parseInt(request.params.id);

    const station = await prisma.gasStation.findUnique({
      where: { id },
      include: {
        pumps: {
          include: {
            _count: {
              select: { expectedChildTags: true },
            },
          },
          orderBy: { pumpNumber: 'asc' },
        },
      },
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

    const data = {
      ...station,
      pumpCount: station.pumps.length,
      pumps: station.pumps.map((pump) => ({
        id: pump.id,
        pumpNumber: pump.pumpNumber,
        mainRfidTag: pump.mainRfidTag,
        status: pump.status,
        expectedChildTagsCount: pump._count.expectedChildTags,
      })),
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
 * Create gas station (admin only)
 */
export async function createStation(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = createStationSchema.parse(request.body);

    const station = await prisma.gasStation.create({
      data: {
        name: body.name,
        location: body.location,
      },
    });

    return reply.status(201).send({
      success: true,
      data: station,
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
 * Update gas station (admin only)
 */
export async function updateStation(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const id = parseInt(request.params.id);
    const body = updateStationSchema.parse(request.body);

    const station = await prisma.gasStation.update({
      where: { id },
      data: body,
    });

    return reply.status(200).send({
      success: true,
      data: station,
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
          message: 'Gas station not found',
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
 * Delete gas station (admin only)
 */
export async function deleteStation(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const id = parseInt(request.params.id);

    await prisma.gasStation.delete({
      where: { id },
    });

    return reply.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Gas station not found',
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
