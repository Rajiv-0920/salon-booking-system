import express from 'express';
import { Router } from 'express';
import authRouter from './auth.route.js';
import userRouter from './user.route.js';
import salonRouter from './salon.route.js';

const router = Router();

router.use('/auth', authRouter);

router.use('/users', userRouter);

router.use('/salons', salonRouter);

export default router;
