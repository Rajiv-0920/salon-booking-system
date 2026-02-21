import express from 'express';
import cors from 'cors';
import apiRoutes from './api/routes/index.js';
import cookieParser from 'cookie-parser';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5000',
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use('/api', apiRoutes);

export default app;
