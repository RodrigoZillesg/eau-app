import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import routes from './routes';
import { developmentFormat, productionFormat, logError } from './utils/logger';
import { ERROR_MESSAGES } from './config/constants';

// Load environment variables
dotenv.config();

const app: Express = express();

// Trust proxy (important for EasyPanel deployment)
app.set('trust proxy', 1);

// CORS configuration - MUST BE FIRST to handle preflight
const allowedOrigins = [
  'http://localhost:5180',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://eauapp.platty.tech',  // Production frontend URL (EasyPanel)
  'http://91.108.104.122:8080'    // Production frontend URL (Ubuntu direct)
];

// Custom CORS middleware (FIRST middleware to handle all CORS including OPTIONS)
app.use((req, res, next) => {
  const origin = req.get('origin');

  // Debug logging
  if (req.method === 'OPTIONS') {
    console.log(`🔍 OPTIONS request from origin: ${origin || 'NO ORIGIN'} to ${req.path}`);
    console.log(`   Allowed origins:`, allowedOrigins);
  }

  // Check if origin is allowed
  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development')) {
    console.log(`✅ CORS: Allowing origin ${origin}`);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      console.log(`📤 Sending OPTIONS 204 response with headers`);
      return res.status(204).end();
    }
  } else if (origin && !allowedOrigins.includes(origin) && process.env.NODE_ENV !== 'development') {
    console.log(`❌ CORS: Rejecting origin ${origin}`);
    return res.status(403).json({ success: false, error: 'Not allowed by CORS' });
  } else if (!origin) {
    console.log(`⚠️  No origin header in request`);
  }

  next();
});

// Security middleware (AFTER CORS to not interfere)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
const isProduction = process.env.NODE_ENV === 'production';
app.use(morgan(isProduction ? productionFormat : developmentFormat));

// Routes
app.use('/', routes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  logError(error, req, res);

  // Don't leak error details in production
  const message = isProduction ? ERROR_MESSAGES.SERVER_ERROR : error.message;
  const stack = isProduction ? undefined : error.stack;

  res.status(500).json({
    success: false,
    error: message,
    stack,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

export default app;