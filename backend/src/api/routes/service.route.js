import { Router } from 'express';
import * as controller from '../controllers/service.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Service
 *   description: Service management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - salonId
 *       properties:
 *         _id:
 *           type: string
 *           example: 65f9c1e8b5a3d45c2a9e1234
 *         name:
 *           type: string
 *           example: Haircut
 *         description:
 *           type: string
 *           example: Professional men's haircut
 *         price:
 *           type: number
 *           example: 299
 *         duration:
 *           type: number
 *           example: 30
 *         category:
 *           type: string
 *           example: Grooming
 *         salonId:
 *           type: string
 *           example: 65f9c1e8b5a3d45c2a9e9999
 */

/**
 * @swagger
 * /services:
 *   get:
 *     summary: Get all services
 *     tags: [Service]
 *     responses:
 *       200:
 *         description: List of all services
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 */
router.get('/', controller.getAllServices);

/**
 * @swagger
 * /salons/{id}:
 *   put:
 *     summary: Update salon
 *     tags: [Salon]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', controller.getServiceById);

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Create a new service
 *     tags: [Service]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       201:
 *         description: Service created successfully
 */
router.post('/', protect, controller.createService);

/**
 * @swagger
 * /services/{id}:
 *   put:
 *     summary: Update a service
 *     tags: [Service]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       200:
 *         description: Service updated successfully
 */
router.put('/:id', protect, controller.updateService);

/**
 * @swagger
 * /services/{id}:
 *   delete:
 *     summary: Delete a service
 *     tags: [Service]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service deleted successfully
 */
router.delete('/:id', protect, controller.deleteService);

/**
 * @swagger
 * /services/salon/{salonId}:
 *   get:
 *     summary: Get services by salon ID
 *     tags: [Service]
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Services for a specific salon
 */
router.get('/salon/:salonId', controller.getServicesBySalonId);

/**
 * @swagger
 * /services/category/{category}:
 *   get:
 *     summary: Get services by category
 *     tags: [Service]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Services filtered by category
 */
router.get('/category/:category', controller.getServicesByCategory);

export default router;
