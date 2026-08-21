import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import { initSocket } from './socket/socketHandler';

dotenv.config({ path: '../.env' }); // Load from root directory
dotenv.config(); // Fallback to current directory

const app = express();
const server = createServer(app);

// Initialize WebSockets
initSocket(server);

// Cors Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Increase limit to handle base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routing
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'UP', timestamp: new Date() });
});

// 404 Route handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Centralized Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server crash error',
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 SIGNALFLARE BACKEND RUNNING ON PORT ${PORT}`);
  console.log(`🔌 WebSockets active and listening for clients`);
  console.log(`===============================================`);
});
