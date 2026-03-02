import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import labourRoutes from './routes/labourRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { sendSuccess } from './utils/apiResponse.js';

const app = express();

const allowedOrigins = env.clientUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS policy: Origin not allowed'));
    },
    credentials: true
  })
);

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => {
  return sendSuccess(
    res,
    {
      status: 'ok',
      timestamp: new Date().toISOString()
    },
    'API is running'
  );
});

app.use('/api/auth', authRoutes);
app.use('/api/labours', labourRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportRoutes);

app.use(notFound);
app.use(errorHandler);

const bootstrap = async () => {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

bootstrap();
