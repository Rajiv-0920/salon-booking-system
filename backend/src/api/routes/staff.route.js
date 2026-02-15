import { Router } from 'express';
import { isTheSalonOwner, protect } from '../middleware/auth.js';
import * as controller from '../controllers/staff.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Staff management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkingDay:
 *       type: object
 *       properties:
 *         open:
 *           type: string
 *           example: "09:00"
 *         close:
 *           type: string
 *           example: "18:00"
 *         isClosed:
 *           type: boolean
 *           example: false
 *
 *     WorkingHours:
 *       type: object
 *       properties:
 *         monday:
 *           $ref: '#/components/schemas/WorkingDay'
 *         tuesday:
 *           $ref: '#/components/schemas/WorkingDay'
 *         wednesday:
 *           $ref: '#/components/schemas/WorkingDay'
 *         thursday:
 *           $ref: '#/components/schemas/WorkingDay'
 *         friday:
 *           $ref: '#/components/schemas/WorkingDay'
 *         saturday:
 *           $ref: '#/components/schemas/WorkingDay'
 *         sunday:
 *           $ref: '#/components/schemas/WorkingDay'
 *
 *     Staff:
 *       type: object
 *       required:
 *         - name
 *         - specialties
 *       properties:
 *         _id:
 *           type: string
 *           example: "65f123abc456def789123456"
 *         salon:
 *           type: string
 *           example: "65f123abc456def789123111"
 *         name:
 *           type: string
 *           example: "John Barber"
 *         specialties:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Haircut", "Beard Trim"]
 *         workingHours:
 *           $ref: '#/components/schemas/WorkingHours'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /staff:
 *   get:
 *     summary: Get all staff members
 *     description: Retrieve a list of all staff members in the system.
 *     tags: [Staff]
 *     responses:
 *       200:
 *         description: Staff list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Staff'
 *       404:
 *         description: Staff not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Staff not found
 *       500:
 *         description: Server error
 */
router.get('/', controller.getAllStaff);

/**
 * @swagger
 * /staff/salon/{salonId}:
 *   get:
 *     summary: Get all staff by salon ID
 *     description: Retrieve all staff members belonging to a specific salon.
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         description: ID of the salon
 *         schema:
 *           type: string
 *           example: "65f123abc456def789123111"
 *     responses:
 *       200:
 *         description: Staff list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Staff'
 *       404:
 *         description: Staff not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Staff not found
 *       500:
 *         description: Server error
 */
router.get('/salon/:salonId', controller.getStaffBySalon);

/**
 * @swagger
 * /staff/{id}:
 *   get:
 *     summary: Get staff by ID
 *     description: Retrieve a single staff member using their unique ID.
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Staff ID
 *         schema:
 *           type: string
 *           example: "65f123abc456def789123456"
 *     responses:
 *       200:
 *         description: Staff retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *       404:
 *         description: Staff not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Staff not found
 *       500:
 *         description: Server error
 */
router.get('/:id', controller.getStaffById);

/**
 * @swagger
 * /staff:
 *   post:
 *     summary: Create new staff (Salon Owner only)
 *     description: Create a new staff member under the authenticated salon owner.
 *     tags: [Staff]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - specialties
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Barber"
 *               specialties:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Haircut", "Beard Trim"]
 *               workingHours:
 *                 $ref: '#/components/schemas/WorkingHours'
 *     responses:
 *       201:
 *         description: Staff created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *       401:
 *         description: Not authorized (Missing or invalid token)
 *       403:
 *         description: Forbidden (Not salon owner)
 *       500:
 *         description: Server error
 */
router.post('/', protect, isTheSalonOwner, controller.createStaff);

/**
 * @swagger
 * /staff/{id}:
 *   put:
 *     summary: Update staff details (Salon Owner only)
 *     description: Update name, specialties, or working hours of a staff member.
 *     tags: [Staff]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Staff ID
 *         schema:
 *           type: string
 *           example: "65f123abc456def789123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Senior Barber"
 *               specialties:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Haircut", "Beard Trim", "Hair Coloring"]
 *               workingHours:
 *                 $ref: '#/components/schemas/WorkingHours'
 *     responses:
 *       200:
 *         description: Staff updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *       401:
 *         description: Not authorized (Missing or invalid token)
 *       403:
 *         description: Forbidden (Not salon owner)
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server error
 */
router.put('/:id', protect, isTheSalonOwner, controller.updateStaff);

/**
 * @swagger
 * /staff/{id}:
 *   delete:
 *     summary: Delete staff (Salon Owner only)
 *     description: Delete a staff member from the salon. Only the authenticated salon owner can perform this action.
 *     tags: [Staff]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Staff ID
 *         schema:
 *           type: string
 *           example: "65f123abc456def789123456"
 *     responses:
 *       200:
 *         description: Staff deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Staff deleted successfully
 *       401:
 *         description: Not authorized (Missing or invalid token)
 *       403:
 *         description: Forbidden (Not salon owner)
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', protect, isTheSalonOwner, controller.deleteStaff);

/**
 * @swagger
 * /staff/{id}/working-hours:
 *   put:
 *     summary: Update staff working hours (Salon Owner only)
 *     description: Update specific working days schedule for a staff member. Only provided days will be updated.
 *     tags: [Staff]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Staff ID
 *         schema:
 *           type: string
 *           example: "65f123abc456def789123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workingHours:
 *                 type: object
 *                 example:
 *                   monday:
 *                     open: "10:00"
 *                     close: "19:00"
 *                     isClosed: false
 *                   sunday:
 *                     isClosed: true
 *     responses:
 *       200:
 *         description: Working hours updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Schedule updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *       401:
 *         description: Not authorized (Missing or invalid token)
 *       403:
 *         description: Forbidden (Not salon owner)
 *       404:
 *         description: Staff not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id/working-hours',
  protect,
  isTheSalonOwner,
  controller.updateStaffWorkingHours,
);

/**
 * @swagger
 * /staff/{id}/availability:
 *   get:
 *     summary: Get available time slots for staff
 *     description: |
 *       Returns available booking time slots for a specific staff member
 *       based on selected date and service duration.
 *       Slots are generated considering working hours and existing bookings.
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Staff ID
 *         schema:
 *           type: string
 *           example: "65f123abc456def789123456"
 *       - in: query
 *         name: date
 *         required: true
 *         description: Booking date (YYYY-MM-DD format)
 *         schema:
 *           type: string
 *           example: "2026-02-15"
 *       - in: query
 *         name: serviceId
 *         required: true
 *         description: Service ID (used to calculate duration)
 *         schema:
 *           type: string
 *           example: "65f123abc456def789999999"
 *     responses:
 *       200:
 *         description: Available time slots retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 slots:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["09:00", "09:30", "11:00", "14:30"]
 *       404:
 *         description: Staff or Service not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Staff or Service not found
 *       500:
 *         description: Server error
 */
router.get('/:id/availability', controller.getStaffAvailability);

/**
 * @swagger
 * /staff/{id}/bookings:
 *   get:
 *     summary: Get all bookings for a staff member
 *     description: Retrieve all bookings associated with a specific staff member. Service details are populated.
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Staff ID
 *         schema:
 *           type: string
 *           example: "65f123abc456def789123456"
 *     responses:
 *       200:
 *         description: Staff bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 bookings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "65f999abc456def789888888"
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2026-02-15"
 *                       time:
 *                         type: string
 *                         example: "10:30"
 *                       status:
 *                         type: string
 *                         example: "confirmed"
 *                       service:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "65f123abc456def789999999"
 *                           name:
 *                             type: string
 *                             example: "Haircut"
 *                           duration:
 *                             type: number
 *                             example: 60
 *       500:
 *         description: Server error
 */
router.get('/:id/bookings', controller.getStaffBookings);

export default router;
