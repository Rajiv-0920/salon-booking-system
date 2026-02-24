import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import * as controller from '../controllers/analytics.controller.js';
import { verifyOwnership } from '../middleware/salon.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Salon and admin analytics endpoints
 */

/**
 * @swagger
 * components:
 *   responses:
 *     Unauthorized:
 *       description: Not authorized, no token or token failed
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Not authorized, no token
 *     Forbidden:
 *       description: Access denied
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Forbidden
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Salon not found
 *     ServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: Something went wrong
 */

/**
 * @swagger
 * /analytics/salon/{salonId}/overview:
 *   get:
 *     summary: Get salon overview stats
 *     description: Returns total bookings, revenue, customers, reviews and avg rating. Accessible by salon owner (own salon) and super-admin.
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: string
 *         description: The salon ID
 *     responses:
 *       200:
 *         description: Salon overview fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalBookings:
 *                       type: number
 *                       example: 120
 *                     totalRevenue:
 *                       type: number
 *                       example: 5400
 *                     totalCustomers:
 *                       type: number
 *                       example: 85
 *                     totalReviews:
 *                       type: number
 *                       example: 40
 *                     avgRating:
 *                       type: number
 *                       example: 4.5
 *                     bookingsByStatus:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: number
 *                           example: 10
 *                         confirmed:
 *                           type: number
 *                           example: 20
 *                         completed:
 *                           type: number
 *                           example: 80
 *                         cancelled:
 *                           type: number
 *                           example: 10
 *                         no_show:
 *                           type: number
 *                           example: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/salon/:salonId/overview',
  protect,
  restrictTo('salon-owner', 'super-admin'),
  verifyOwnership('salonId'),
  controller.getSalonOverview,
);

/**
 * @swagger
 * /analytics/salon/{salonId}/revenue:
 *   get:
 *     summary: Get salon revenue analytics
 *     description: Returns revenue breakdown grouped by period. Accessible by salon owner (own salon) and super-admin.
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: string
 *         description: The salon ID
 *         example: 69987e5032b6680f92c33869
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: monthly
 *         description: Group revenue by this period
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start of date range (YYYY-MM-DD)
 *         example: 2026-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End of date range (YYYY-MM-DD)
 *         example: 2026-03-31
 *     responses:
 *       200:
 *         description: Revenue analytics fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       example: 5400
 *                     breakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                             example: "2026-01"
 *                           revenue:
 *                             type: number
 *                             example: 1800
 *                           bookings:
 *                             type: number
 *                             example: 40
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/salon/:salonId/revenue',
  protect,
  restrictTo('salon-owner', 'super-admin'),
  verifyOwnership('salonId'),
  controller.getSalonRevenue,
);

/**
 * @swagger
 * /analytics/salon/{salonId}/popular-services:
 *   get:
 *     summary: Get most booked services for a salon
 *     description: Returns top N services ranked by booking count and revenue. Accessible by salon owner (own salon) and super-admin.
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: string
 *         description: The salon ID
 *         example: 69987e5032b6680f92c33869
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 5
 *         description: Number of top services to return
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-03-31
 *     responses:
 *       200:
 *         description: Popular services fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       serviceId:
 *                         type: string
 *                         example: 6998a78a6f0ce23fad468cc9
 *                       name:
 *                         type: string
 *                         example: Haircut
 *                       bookingCount:
 *                         type: number
 *                         example: 45
 *                       revenue:
 *                         type: number
 *                         example: 2025
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/salon/:salonId/popular-services',
  protect,
  restrictTo('salon-owner', 'super-admin'),
  verifyOwnership('salonId'),
  controller.getPopularServices,
);

/**
 * @swagger
 * /analytics/salon/{salonId}/peak-hours:
 *   get:
 *     summary: Get peak booking hours for a salon
 *     description: Returns booking count grouped by hour of day to identify busiest times. Accessible by salon owner (own salon) and super-admin.
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: string
 *         description: The salon ID
 *         example: 69987e5032b6680f92c33869
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-03-31
 *     responses:
 *       200:
 *         description: Peak hours fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hour:
 *                         type: string
 *                         example: "10:00"
 *                       bookingCount:
 *                         type: number
 *                         example: 18
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/salon/:salonId/peak-hours',
  protect,
  restrictTo('salon-owner', 'super-admin'),
  verifyOwnership(salonId),
  controller.getPeakHours,
);

/**
 * @swagger
 * /analytics/salon/{salonId}/customer-stats:
 *   get:
 *     summary: Get customer statistics for a salon
 *     description: Returns new vs returning customers, top customers by booking count. Accessible by salon owner (own salon) and super-admin.
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: string
 *         description: The salon ID
 *         example: 69987e5032b6680f92c33869
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-03-31
 *     responses:
 *       200:
 *         description: Customer stats fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCustomers:
 *                       type: number
 *                       example: 85
 *                     newCustomers:
 *                       type: number
 *                       example: 20
 *                     returningCustomers:
 *                       type: number
 *                       example: 65
 *                     topCustomers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                             example: 6997276b3967f64226370bcb
 *                           name:
 *                             type: string
 *                             example: Ahmed Ali
 *                           bookingCount:
 *                             type: number
 *                             example: 12
 *                           totalSpent:
 *                             type: number
 *                             example: 540
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/salon/:salonId/customer-stats',
  protect,
  restrictTo('salon-owner', 'super-admin'),
  verifyOwnership('salonId'),
  controller.getCustomerStats,
);

/**
 * @swagger
 * /analytics/admin/overview:
 *   get:
 *     summary: Get admin dashboard overview (all salons)
 *     description: Returns platform-wide stats including total salons, bookings, revenue and users. Super-admin only.
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Admin overview fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalSalons:
 *                       type: number
 *                       example: 24
 *                     totalBookings:
 *                       type: number
 *                       example: 1850
 *                     totalRevenue:
 *                       type: number
 *                       example: 83250
 *                     totalUsers:
 *                       type: number
 *                       example: 430
 *                     totalStaff:
 *                       type: number
 *                       example: 96
 *                     bookingsByStatus:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: number
 *                           example: 80
 *                         confirmed:
 *                           type: number
 *                           example: 200
 *                         completed:
 *                           type: number
 *                           example: 1400
 *                         cancelled:
 *                           type: number
 *                           example: 150
 *                         no_show:
 *                           type: number
 *                           example: 20
 *                     topSalons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           salonId:
 *                             type: string
 *                             example: 69987e5032b6680f92c33869
 *                           name:
 *                             type: string
 *                             example: Glamour Studio
 *                           totalBookings:
 *                             type: number
 *                             example: 320
 *                           totalRevenue:
 *                             type: number
 *                             example: 14400
 *                           avgRating:
 *                             type: number
 *                             example: 4.8
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/admin/overview',
  protect,
  restrictTo('super-admin'),
  controller.getAdminOverview,
);

export default router;
