import express from 'express';
import { Router } from 'express';
import authRouter from './auth.route.js';
import userRouter from './user.route.js';
import salonRouter from './salon.route.js';
import serviceRouter from './service.route.js';
import categoryRouter from './category.route.js';
import staffRouter from './staff.route.js';
import bookingRouter from './booking.route.js';
import reviewRouter from './review.route.js';
import analyticsRouter from './analytics.route.js';

const router = Router();

router.use('/auth', authRouter);

router.use('/users', userRouter);

router.use('/salons', salonRouter);

router.use('/services', serviceRouter);

router.use('/categories', categoryRouter);

router.use('/staff', staffRouter);

router.use('/bookings', bookingRouter);

router.use('/reviews', reviewRouter);

router.use('/analytics', analyticsRouter);

export default router;
