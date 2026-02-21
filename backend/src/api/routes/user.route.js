import { Router } from 'express';
import {
  protect,
  restrictTo,
  verifySelfOrSuperAdmin,
} from '../middleware/auth.middleware.js';
import * as controller from '../controllers/user.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 65f123abc456def789012345
 *         name:
 *           type: string
 *           example: Rajiv Kumar
 *         email:
 *           type: string
 *           example: rajiv@gmail.com
 *         role:
 *           type: string
 *           example: user
 *       required:
 *         - name
 *         - email
 *     Booking:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 66a123abc456def789012345
 *         service:
 *           type: string
 *           example: Car Wash
 *         date:
 *           type: string
 *           format: date-time
 *           example: 2026-02-12T10:00:00Z
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Access denied
 */
router.get('/', protect, restrictTo('super-admin'), controller.getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID (Owner or Admin)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get(
  '/:id',
  protect,
  verifySelfOrSuperAdmin('id'),
  controller.getUserById,
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user by ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.put(
  '/:id',
  protect,
  verifySelfOrSuperAdmin('id'),
  controller.updateUserById,
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user by ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.delete(
  '/:id',
  protect,
  restrictTo('super-admin'),
  controller.deleteUserById,
);

/**
 * @swagger
 * /users/{id}/bookings:
 *   get:
 *     summary: Get bookings of a user (Owner or Admin)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of user bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.get(
  '/:id/bookings',
  protect,
  verifySelfOrSuperAdmin('id'),
  controller.getUserBookings,
);

export default router;
