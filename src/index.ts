import express from 'express';
import dotenv from 'dotenv';
import { MolliePaymentService } from './services/molliePayment';
import { EmailService } from './services/emailService';
import { LotteryService } from './services/lotteryService';
import { createLotteryRouter } from './routes/lottery';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'MOLLIE_API_KEY',
  'REDIRECT_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'FROM_EMAIL',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize services
const paymentService = new MolliePaymentService(
  process.env.MOLLIE_API_KEY!,
  process.env.REDIRECT_URL!,
  process.env.WEBHOOK_URL
);

const emailService = new EmailService(
  {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT!),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  process.env.FROM_EMAIL!,
  process.env.FROM_NAME || 'De Boss Loterij'
);

const lotteryService = new LotteryService(paymentService, emailService);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/lottery', createLotteryRouter(lotteryService));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'De Boss Loterij Payment Module',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'De Boss Loterij Payment Module',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      createTicket: 'POST /api/lottery/ticket',
      getTicket: 'GET /api/lottery/ticket/:ticketId',
      checkStatus: 'GET /api/lottery/ticket/:ticketId/status',
      getTicketsByEmail: 'GET /api/lottery/tickets/email/:email',
      webhook: 'POST /api/lottery/webhook',
    },
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎰 De Boss Loterij Payment Module started`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 API available at http://localhost:${PORT}`);
  console.log(`💳 Mollie integration: ${process.env.MOLLIE_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`📧 Email service: ${process.env.SMTP_HOST ? 'Configured' : 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
