import { Router } from 'express';
import * as controller from '../controllers/salon.controller.js';
import { isTheSalonOwner, protect } from '../middleware/auth.js';
import { upload } from '../library/cloudinary.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Salon
 *   description: Salon management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Salon:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         phone:
 *           type: string
 *         description:
 *           type: string
 *         location:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /salons:
 *   post:
 *     summary: Create a new salon
 *     tags: [Salon]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Salon'
 *     responses:
 *       201:
 *         description: Salon created successfully
 */
router.post('/', protect, controller.createSalon);

/**
 * @swagger
 * /salons:
 *   get:
 *     summary: Get all salons
 *     tags: [Salon]
 *     responses:
 *       200:
 *         description: List of salons
 */
router.get('/', controller.getSalons);

/**
 * @swagger
 * /salons/search:
 *   get:
 *     summary: Search salons
 *     tags: [Salon]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search keyword
 *     responses:
 *       200:
 *         description: Filtered salons
 */
router.get('/search', controller.searchSalons);

/**
 * @swagger
 * /salons/nearby:
 *   get:
 *     summary: Get nearby salons
 *     tags: [Salon]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5
 *     responses:
 *       200:
 *         description: Nearby salons
 */
router.get('/nearby', controller.getNearbySalons);

/**
 * @swagger
 * /salons/{id}:
 *   get:
 *     summary: Get salon by ID
 *     tags: [Salon]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Salon details
 */
router.get('/:id', controller.getSalon);

/**
 * @swagger
 * /salons/{id}:
 *   put:
 *     summary: Update salon
 *     tags: [Salon]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Salon'
 *     responses:
 *       200:
 *         description: Salon updated
 */
router.put('/:id', protect, isTheSalonOwner, controller.updateSalon);

/**
 * @swagger
 * /salons/{id}:
 *   delete:
 *     summary: Delete salon
 *     tags: [Salon]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Salon deleted
 */
router.delete('/:id', protect, isTheSalonOwner, controller.deleteSalon);

/**
 * @swagger
 * /salons/{id}/services:
 *   get:
 *     summary: Get salon services
 *     tags: [Salon]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Salon services list
 */
router.get('/:id/services', controller.getSalonServices);

/**
 * @swagger
 * /salons/{id}/staff:
 *   get:
 *     summary: Get salon staff
 *     tags: [Salon]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Salon staff list
 */
router.get('/:id/staff', controller.getSalonStaff);

/**
 * @swagger
 * /salons/{id}/reviews:
 *   get:
 *     summary: Get salon reviews
 *     tags: [Salon]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Salon reviews list
 */
router.get('/:id/reviews', controller.getSalonReviews);

/**
 * @swagger
 * /salons/{id}/bookings:
 *   get:
 *     summary: Get salon bookings (Owner only)
 *     tags: [Salon]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Salon bookings
 */
router.get(
  '/:id/bookings',
  protect,
  isTheSalonOwner,
  controller.getSalonBookings,
);

/**
 * @swagger
 * /salons/{id}/working-hours:
 *   put:
 *     summary: Update salon working hours
 *     tags: [Salon]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The salon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workingHours
 *             properties:
 *               workingHours:
 *                 type: object
 *                 description: Weekly working hours configuration
 *                 properties:
 *                   monday:
 *                     type: object
 *                     properties:
 *                       open:
 *                         type: string
 *                         example: "09:00"
 *                       close:
 *                         type: string
 *                         example: "18:00"
 *                       isClosed:
 *                         type: boolean
 *                         example: false
 *                   sunday:
 *                     type: object
 *                     properties:
 *                       open:
 *                         type: string
 *                         example: "00:00"
 *                       close:
 *                         type: string
 *                         example: "00:00"
 *                       isClosed:
 *                         type: boolean
 *                         example: true
 *     responses:
 *       200:
 *         description: Working hours updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Salon not found
 */
router.put(
  '/:id/working-hours',
  protect,
  isTheSalonOwner,
  controller.updateWorkingHours,
);

/**
 * @swagger
 * /salons/{id}/holidays:
 *   put:
 *     summary: Update salon holidays
 *     tags: [Salon]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the salon
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - holidays
 *             properties:
 *               holidays:
 *                 type: array
 *                 description: List of holiday dates when the salon will be closed
 *                 items:
 *                   type: string
 *                   format: date
 *                 example:
 *                   - "2026-03-25"
 *                   - "2026-04-10"
 *     responses:
 *       200:
 *         description: Holidays updated successfully
 *       400:
 *         description: Invalid date format
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Salon not found
 */
router.put(
  '/:id/holidays',
  protect,
  isTheSalonOwner,
  controller.updateHolidays,
);

/**
 * @swagger
 * /salons/{id}/availability:
 *   put:
 *     summary: Update salon availability
 *     tags: [Salon]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the salon
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isAvailable
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 description: Set to true to open the salon for bookings, false to close it.
 *                 example: true
 *     responses:
 *       200:
 *         description: Availability updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Salon not found
 */
router.put(
  '/:id/availability',
  protect,
  isTheSalonOwner,
  controller.updateAvailability,
);

/**
 * @swagger
 * /salons/{id}/images:
 *   post:
 *     summary: Upload salon images
 *     tags: [Salon]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the salon
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 description: Select one or more image files to upload
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 imageUrls:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: "https://res.cloudinary.com/demo/image/upload/sample.jpg"
 *       400:
 *         description: No files uploaded or invalid format
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Salon not found
 */
router.post(
  '/:id/images',
  protect,
  isTheSalonOwner,
  upload.array('images', 5),
  controller.uploadSalonImages,
);

/**
 * @swagger
 * /salons/{id}/images/{imageId}:
 *   delete:
 *     summary: Delete salon image
 *     tags: [Salon]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted
 */
router.delete(
  '/:id/images/:imageId',
  protect,
  isTheSalonOwner,
  controller.deleteSalonImage,
);

export default router;
