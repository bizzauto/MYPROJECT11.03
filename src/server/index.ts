import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Prisma
export const prisma = new PrismaClient({
  log: NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Winston Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://checkout.razorpay.com", "https://fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      frameSrc: ["'self'", "https://checkout.razorpay.com"],
      workerSrc: ["'self'", "blob:"],
      manifestSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request ID middleware
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0'
  });
});

// API Routes
import authRoutes from './routes/auth.js';
import businessRoutes from './routes/business.js';
import contactsRoutes from './routes/contacts.js';
import whatsappRoutes from './routes/whatsapp.js';
import campaignsRoutes from './routes/campaigns.js';
import postsRoutes from './routes/posts.js';
import postersRoutes from './routes/posters.js';
import chatbotRoutes from './routes/chatbot.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';
import reviewsRoutes from './routes/reviews.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import webhooksRoutes from './routes/webhooks.js';
import integrationsRoutes from './routes/integrations.js';
import leadsRoutes from './routes/leads.js';
import superAdminRoutes from './routes/super-admin.js';
import teamRoutes from './routes/team.js';
import automationRoutes from './routes/automation.js';
import intelligenceRoutes from './routes/intelligence.js';
import settingsRoutes from './routes/settings.js';
import reportsRoutes from './routes/reports.js';
import ecommerceRoutes from './routes/ecommerce.js';
import documentsRoutes from './routes/documents.js';
import qwenPreviewRoutes from './routes/qwen-preview.js';
import evolutionRoutes from './routes/evolution.js';
import notificationsRoutes from './routes/notifications.js';
import appointmentsRoutes from './routes/appointments.js';
import googleBusinessRoutes from './routes/google-business.js';
import indiamartEmailRoutes from './routes/indiamart-email.js';
import twoFactorRoutes from './routes/twoFactor.js';
import emailRoutes from './routes/email.js';
import { validateCSRF } from './middleware/csrf.js';

app.use('/api/auth', authRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/email', emailRoutes);

// Apply CSRF protection to state-changing routes (after auth, before data routes)
// GET requests are exempt, POST/PUT/DELETE require CSRF token
app.use('/api/business', validateCSRF, businessRoutes);
app.use('/api/contacts', validateCSRF, contactsRoutes);
app.use('/api/campaigns', validateCSRF, campaignsRoutes);
app.use('/api/posts', validateCSRF, postsRoutes);
app.use('/api/whatsapp', validateCSRF, whatsappRoutes);
app.use('/api/posters', validateCSRF, postersRoutes);
app.use('/api/chatbot', validateCSRF, chatbotRoutes);
app.use('/api/analytics', analyticsRoutes); // Read-only
app.use('/api/ai', validateCSRF, aiRoutes);
app.use('/api/qwen', validateCSRF, qwenPreviewRoutes);
app.use('/api/reviews', validateCSRF, reviewsRoutes);
app.use('/api/subscriptions', validateCSRF, subscriptionsRoutes);
app.use('/api/webhooks', webhooksRoutes); // External webhooks
app.use('/api/integrations', validateCSRF, integrationsRoutes);
app.use('/api/leads', validateCSRF, leadsRoutes);
app.use('/api/super-admin', validateCSRF, superAdminRoutes);
app.use('/api/team', validateCSRF, teamRoutes);
app.use('/api/automation', validateCSRF, automationRoutes);
app.use('/api/intelligence', validateCSRF, intelligenceRoutes);
app.use('/api/settings', validateCSRF, settingsRoutes);
app.use('/api/reports', analyticsRoutes); // Read-only
app.use('/api/ecommerce', validateCSRF, ecommerceRoutes);
app.use('/api/documents', validateCSRF, documentsRoutes);
app.use('/api/evolution', validateCSRF, evolutionRoutes);
app.use('/api/notifications', validateCSRF, notificationsRoutes);
app.use('/api/appointments', validateCSRF, appointmentsRoutes);
app.use('/api/google-business', validateCSRF, googleBusinessRoutes);
app.use('/api/indiamart', validateCSRF, indiamartEmailRoutes);

// Serve static frontend files in production
if (NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', '..', 'dist', 'client');
  app.use(express.static(clientBuildPath));
  // SPA fallback - serve index.html for all non-API routes
  app.use((req, res, next) => {
<<<<<<< HEAD
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    } else {
      next();
    }
  });
=======
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  } else {
    next();
  }
});
>>>>>>> e78136192bdb379dd4d5b6bda7e67dc6b22d7257
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  logger.error('Uncaught Exception:', error);
  await prisma.$disconnect();
  process.exit(1);
});

// Start server
app.listen(Number(PORT), HOST, () => {
  logger.info(`Server running on http://${HOST}:${PORT} in ${NODE_ENV} mode`);
});

// Export authenticate middleware for use in routes
export { authenticate } from './middleware/auth.js';

export default app;
