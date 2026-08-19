import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import chatRouter from './routes/chat';

const app = express();

// Security middleware
app.use(helmet());

// Logging middleware
app.use(morgan('dev'));

// CORS configuration (allow requests from frontend dev environment)
app.use(cors({
  origin: '*', // We can restrict this to specific domains if needed, e.g. http://localhost:5173
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json());

// Routes
app.use('/api/chat', chatRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 Route handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Centralized error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: 'Server error',
    message,
  });
});

// Start listening
app.listen(config.PORT, () => {
  console.log(`🚀 AskFlow AI Backend running on port ${config.PORT}`);
});
