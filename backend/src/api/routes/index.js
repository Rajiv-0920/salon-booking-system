import express from 'express';
import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome to the Salon Booking System API!
 *     description: Returns a welcome message.
 *     responses:
 *       200:
 *         description: Welcome message.
 */
router.get('/', (req, res) => {
  res.send('Welcome to the Salon Booking System API!');
});

export default router;
