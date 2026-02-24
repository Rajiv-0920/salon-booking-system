// GET    /api/admin/users                - Get all users with filters
// GET    /api/admin/salons               - Get all salons with stats
// GET    /api/admin/bookings             - Get all bookings
// PUT    /api/admin/users/:id/status     - Activate/deactivate user
// PUT    /api/admin/salons/:id/verify    - Verify/approve salon
// GET    /api/admin/reports              - Get system reports
// DELETE /api/admin/users/:id            - Delete user
// DELETE /api/admin/salons/:id           - Delete salon
import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import * as controller from '../controllers/admin.controller.js';

const router = Router();

router.get(
  '/users',
  protect,
  restrictTo('super-admin'),
  controller.getAllUsers,
);

router.get(
  '/salons',
  protect,
  restrictTo('super-admin'),
  controller.getAllSalons,
);

router.get(
  '/bookings',
  protect,
  restrictTo('super-admin'),
  controller.getAllBookings,
);

router.put(
  '/users/:id/status',
  protect,
  restrictTo('super-admin'),
  controller.updateUserStatus,
);

router.delete(
  '/users/:id',
  protect,
  restrictTo('super-admin'),
  controller.deleteUserById,
);

router.delete(
  '/salons/:id',
  protect,
  restrictTo('super-admin'),
  controller.deleteSalonById,
);

// router.put(
//   '/salons/:id/verify',
//   protect,
//   restrictTo('super-admin'),
//   verifySalon,
// );
// router.get('/reports', protect, restrictTo('super-admin'), getSystemReports);

export default router;
