import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import stationRoutes from './routes/stations';
import pumpRoutes, { stationPumpRoutes } from './routes/pumps';
import verificationRoutes, { pumpVerificationRoutes } from './routes/verifications';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '3000');
const HOST = process.env.HOST || '0.0.0.0';

// Create Fastify instance
const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
  },
});

// Register plugins
async function registerPlugins() {
  // CORS
  await server.register(cors, {
    origin: process.env.CORS_ORIGIN === '*' ? true : (process.env.CORS_ORIGIN || 'http://localhost:8081'),
    credentials: true,
  });

  // JWT
  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: parseInt(process.env.RATE_LIMIT_TIMEWINDOW || '60000'),
  });
}

// Register routes
async function registerRoutes() {
  // Health check route
  server.get('/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'connected',
    };
  });

  // Root route
  server.get('/', async () => {
    return {
      message: 'Gas Station RFID API',
      version: '1.0.0',
      docs: '/api/v1',
    };
  });

  // API v1 info route
  server.get('/api/v1', async () => {
    return {
      message: 'Gas Station RFID API v1',
      endpoints: {
        auth: {
          login: 'POST /api/v1/auth/login',
          logout: 'POST /api/v1/auth/logout',
          me: 'GET /api/v1/auth/me',
        },
        stations: {
          list: 'GET /api/v1/stations',
          get: 'GET /api/v1/stations/:id',
          create: 'POST /api/v1/stations (admin)',
          update: 'PUT /api/v1/stations/:id (admin)',
          delete: 'DELETE /api/v1/stations/:id (admin)',
        },
        pumps: {
          listByStation: 'GET /api/v1/stations/:stationId/pumps',
          get: 'GET /api/v1/pumps/:id',
          create: 'POST /api/v1/stations/:stationId/pumps (admin)',
          update: 'PUT /api/v1/pumps/:id (admin)',
          delete: 'DELETE /api/v1/pumps/:id (admin)',
        },
        verifications: {
          verify: 'POST /api/v1/pumps/:id/verify',
          list: 'GET /api/v1/pumps/:id/verifications',
          get: 'GET /api/v1/verifications/:sessionId',
        },
      },
    };
  });

  // Register API routes
  await server.register(authRoutes, { prefix: '/api/v1/auth' });
  await server.register(stationRoutes, { prefix: '/api/v1/stations' });
  await server.register(pumpRoutes, { prefix: '/api/v1/pumps' });
  await server.register(verificationRoutes, { prefix: '/api/v1/verifications' });

  // Register nested routes (station pumps)
  await server.register(
    async (instance) => {
      instance.register(stationPumpRoutes, { prefix: '/:stationId/pumps' });
    },
    { prefix: '/api/v1/stations' }
  );

  // Register nested routes (pump verifications)
  await server.register(
    async (instance) => {
      instance.register(pumpVerificationRoutes, { prefix: '/:id/verify' });
    },
    { prefix: '/api/v1/pumps' }
  );

  // Register verification history route
  await server.register(
    async (instance) => {
      instance.register(
        async (subInstance) => {
          const { getPumpVerifications } = await import('./controllers/verificationController');
          const { authenticate } = await import('./middleware/auth');
          subInstance.get('/', { preHandler: [authenticate] }, getPumpVerifications);
        },
        { prefix: '/:id/verifications' }
      );
    },
    { prefix: '/api/v1/pumps' }
  );
}

// Error handler
server.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  // JWT errors
  if (error.name === 'UnauthorizedError') {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing authentication token',
      },
    });
  }

  // Rate limit errors
  if (error.statusCode === 429) {
    return reply.status(429).send({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      },
    });
  }

  // Validation errors
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: error.validation,
      },
    });
  }

  // Default error
  const statusCode = error.statusCode || 500;
  return reply.status(statusCode).send({
    success: false,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred',
    },
  });
});

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    await server.listen({
      port: PORT,
      host: HOST,
    });

    console.log('');
    console.log('🚀 ========================================');
    console.log('   Gas Station RFID API Server Started!');
    console.log('========================================');
    console.log('');
    console.log(`📍 Server:      http://${HOST}:${PORT}`);
    console.log(`🏥 Health:      http://${HOST}:${PORT}/health`);
    console.log(`📚 API Docs:    http://${HOST}:${PORT}/api/v1`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
    console.log('✅ Ready to accept connections!');
    console.log('');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log('');
    console.log(`🛑 Received ${signal}, shutting down gracefully...`);
    try {
      await server.close();
      console.log('✅ Server closed successfully');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
  });
});

start();
