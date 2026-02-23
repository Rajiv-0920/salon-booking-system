import { Router } from 'express';
import * as controller from '../controllers/review.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import {
  verifyReviewOwnership,
  verifyReviewSalonOwnership,
} from '../middleware/review.middleware.js';

const router = Router();

router.get('/', controller.getAllReviews);

router.get('/:id', controller.getReviewById);

router.post('/', protect, restrictTo('customer'), controller.createReview);

router.put('/:id', protect, verifyReviewOwnership, controller.updateReview);

router.delete('/:id', protect, verifyReviewOwnership, controller.deleteReview);

router.get('/salon/:salonId', controller.getReviewBySalon);

router.get('/user/:userId', controller.getReviewByUser);

router.post(
  '/:id/reply',
  protect,
  restrictTo('salon-owner'),
  verifyReviewSalonOwnership,
  controller.replyToReview,
);

export default router;
