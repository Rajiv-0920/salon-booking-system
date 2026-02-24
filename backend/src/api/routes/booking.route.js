import { Router } from 'express';
import {
  restrictTo,
  protect,
  verifySelfOrSuperAdmin,
} from '../middleware/auth.middleware.js';
import {
  verifyBookingAccess,
  verifyBookingCustomerOrOwner,
  verifyBookingSalonOwnership,
} from '../middleware/booking.middleware.js';
import { verifySalonAccess } from '../middleware/salon.middleware.js';
import * as controller from '../controllers/booking.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management endpoints
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: token
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 64a1f2c3e4b5d6789abcdef0
 *         salon:
 *           type: string
 *           example: 64a1f2c3e4b5d6789abcdef1
 *         customer:
 *           type: string
 *           example: 64a1f2c3e4b5d6789abcdef2
 *         staff:
 *           type: string
 *           example: 64a1f2c3e4b5d6789abcdef3
 *         services:
 *           type: array
 *           items:
 *             type: string
 *         date:
 *           type: string
 *           format: date-time
 *           example: 2025-08-01T10:00:00.000Z
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *           example: confirmed
 *         totalPrice:
 *           type: number
 *           example: 120.00
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     AvailabilityRequest:
 *       type: object
 *       required:
 *         - salonId
 *         - date
 *         - services
 *       properties:
 *         salonId:
 *           type: string
 *           example: 64a1f2c3e4b5d6789abcdef1
 *         date:
 *           type: string
 *           format: date-time
 *           example: 2025-08-01T10:00:00.000Z
 *         services:
 *           type: array
 *           items:
 *             type: string
 *         staffId:
 *           type: string
 *           example: 64a1f2c3e4b5d6789abcdef3
 *     CreateBookingRequest:
 *       type: object
 *       required:
 *         - salonId
 *         - services
 *         - date
 *       properties:
 *         salonId:
 *           type: string
 *           example: 64a1f2c3e4b5d6789abcdef1
 *         services:
 *           type: array
 *           items:
 *             type: string
 *         staffId:
 *           type: string
 *           example: 64a1f2c3e4b5d6789abcdef3
 *         date:
 *           type: string
 *           format: date-time
 *           example: 2025-08-01T10:00:00.000Z
 *         notes:
 *           type: string
 *           example: Please use organic products
 *     UpdateBookingRequest:
 *       type: object
 *       properties:
 *         services:
 *           type: array
 *           items:
 *             type: string
 *         notes:
 *           type: string
 *         staffId:
 *           type: string
 *     RescheduleRequest:
 *       type: object
 *       required:
 *         - date
 *       properties:
 *         date:
 *           type: string
 *           format: date-time
 *           example: 2025-08-05T14:00:00.000Z
 *     StatusUpdateRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *           example: confirmed
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: error
 *         message:
 *           type: string
 *           example: Something went wrong
 */

// ── Public ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /bookings/check-availability:
 *   post:
 *     summary: Check slot availability for a salon
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AvailabilityRequest'
 *     responses:
 *       200:
 *         description: Available time slots returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     availableSlots:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/check-availability', controller.checkAvailability);

// ── Super-Admin only ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings (super-admin only)
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 50
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden — insufficient role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', protect, restrictTo('super-admin'), controller.getAllBookings);

// ── Authenticated — scoped by role inside controller ─────────────────────────

/**
 * @swagger
 * /bookings/upcoming:
 *   get:
 *     summary: Get upcoming bookings for the authenticated user (scoped by role)
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Upcoming bookings returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/upcoming', protect, controller.getUpcomingBookings);

/**
 * @swagger
 * /bookings/past:
 *   get:
 *     summary: Get past bookings for the authenticated user (scoped by role)
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Past bookings returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/past', protect, controller.getPastBookings);

/**
 * @swagger
 * /bookings/today:
 *   get:
 *     summary: Get today's bookings (salon-owner, staff, super-admin)
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Today's bookings returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden — insufficient role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/today',
  protect,
  restrictTo('salon-owner', 'staff', 'super-admin'),
  controller.getTodayBookings,
);

/**
 * @swagger
 * /bookings/calendar/{salonId}:
 *   get:
 *     summary: Get calendar view bookings for a salon (salon-owner, staff, super-admin)
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: string
 *         description: The salon ID to fetch calendar bookings for
 *         example: 64a1f2c3e4b5d6789abcdef1
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start of the calendar range (YYYY-MM-DD)
 *         example: 2025-08-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End of the calendar range (YYYY-MM-DD)
 *         example: 2025-08-31
 *     responses:
 *       200:
 *         description: Calendar bookings returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden — insufficient role or no salon access
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Salon not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/calendar/:salonId',
  protect,
  restrictTo('salon-owner', 'staff', 'super-admin'),
  verifySalonAccess,
  controller.getCalendarBookings,
);

/**
 * @swagger
 * /bookings/user/{userId}:
 *   get:
 *     summary: Get all bookings for a specific user (self or super-admin)
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID whose bookings to retrieve
 *         example: 64a1f2c3e4b5d6789abcdef2
 *     responses:
 *       200:
 *         description: User bookings returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden — can only access own bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/user/:userId',
  protect,
  verifySelfOrSuperAdmin('userId'),
  controller.getUserBookings,
);

/**
 * @swagger
 * /bookings/salon/{salonId}:
 *   get:
 *     summary: Get all bookings for a specific salon
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: string
 *         description: The salon ID whose bookings to retrieve
 *         example: 64a1f2c3e4b5d6789abcdef1
 *     responses:
 *       200:
 *         description: Salon bookings returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden — no access to this salon
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Salon not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/salon/:salonId',
  protect,
  verifySalonAccess,
  controller.getSalonBookings,
);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get a single booking by ID
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID
 *         example: 64a1f2c3e4b5d6789abcdef0
 *     responses:
 *       200:
 *         description: Booking returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden — no access to this booking
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Recheck this route
router.get('/:id', protect, verifyBookingAccess, controller.getSingleBooking);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingRequest'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid request body or slot unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', protect, controller.createBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   put:
 *     summary: Update a booking (customer own booking, salon-owner own salon, super-admin)
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID
 *         example: 64a1f2c3e4b5d6789abcdef0
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBookingRequest'
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden — no ownership of this booking
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  protect,
  verifyBookingCustomerOrOwner,
  controller.updateBooking,
);

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Cancel a booking (customer own booking, salon-owner own salon, super-admin)
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID to cancel
 *         example: 64a1f2c3e4b5d6789abcdef0
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Booking cancelled successfully
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden — no ownership of this booking
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  protect,
  verifyBookingCustomerOrOwner,
  controller.cancelBooking,
);

/**
 * @swagger
 * /bookings/{id}/reschedule:
 *   post:
 *     summary: Reschedule a booking (customer own booking, salon-owner own salon, super-admin)
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID to reschedule
 *         example: 64a1f2c3e4b5d6789abcdef0
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RescheduleRequest'
 *     responses:
 *       200:
 *         description: Booking rescheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Requested slot is unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden — no ownership of this booking
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:id/reschedule',
  protect,
  verifyBookingCustomerOrOwner,
  controller.rescheduleBooking,
);

/**
 * @swagger
 * /bookings/{id}/status:
 *   put:
 *     summary: Update booking status (salon-owner, staff, super-admin)
 *     tags: [Bookings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID whose status to update
 *         example: 64a1f2c3e4b5d6789abcdef0
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StatusUpdateRequest'
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden — insufficient role or booking does not belong to your salon
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id/status',
  protect,
  restrictTo('salon-owner', 'staff', 'super-admin'),
  verifyBookingSalonOwnership,
  controller.updateBookingStatus,
);

export default router;
