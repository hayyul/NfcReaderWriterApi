import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../services/prisma';
import { comparePassword, generateTokenPayload } from '../utils/auth';
import { loginSchema, LoginInput } from '../types/schemas';

/**
 * Login handler
 */
export async function login(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Validate input
    const body = loginSchema.parse(request.body);
    const { username, password } = body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.isActive) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password',
        },
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password',
        },
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token
    const tokenPayload = generateTokenPayload({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const token = request.server.jwt.sign(tokenPayload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    // Calculate expiration time
    const expiresIn = 24 * 60 * 60; // 24 hours in seconds
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Store token in database
    await prisma.authToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return reply.status(200).send({
      success: true,
      data: {
        accessToken: token,
        tokenType: 'Bearer',
        expiresIn,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
        },
      },
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
        message: 'An error occurred during login',
      },
    });
  }
}

/**
 * Logout handler
 */
export async function logout(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = request.user as any;
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (token) {
      // Revoke token in database
      await prisma.authToken.updateMany({
        where: {
          userId: user.userId,
          token,
        },
        data: {
          revoked: true,
        },
      });
    }

    return reply.status(200).send({
      success: true,
      data: {
        message: 'Successfully logged out',
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred during logout',
      },
    });
  }
}

/**
 * Get current user info
 */
export async function me(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = request.user as any;

    const userInfo = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return reply.status(200).send({
      success: true,
      data: userInfo,
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
