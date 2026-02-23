import Review from '../models/review.model.js';
import Booking from '../models/booking.model.js';
import Salon from '../models/salon.model.js';

export const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating, salonId, sort } = req.query;
    const skip = (page - 1) * limit;
    const query = {};

    if (rating) query.rating = rating;
    if (salonId) query.salonId = salonId;

    let sortQuery = { createdAt: -1 };
    if (sort === 'highest') sortQuery = { rating: -1 };
    if (sort === 'lowest') sortQuery = { rating: 1 };

    const reviews = await Review.find(query)
      .skip(skip)
      .limit(limit)
      .sort(sortQuery);

    res
      .status(200)
      .json({ message: 'Reviews fetched successfully', data: reviews });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res
      .status(200)
      .json({ message: 'Review fetched successfully', data: review });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createReview = async (req, res) => {
  try {
    const { salonId, bookingId, rating, comment } = req.body;

    if (!salonId || !bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'salonId, bookingId and rating are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: this booking does not belong to you',
      });
    }

    if (booking.salonId.toString() !== salonId) {
      return res.status(400).json({
        success: false,
        message: 'Booking does not belong to this salon',
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review a completed booking',
      });
    }

    const alreadyReviewedBooking = await Review.exists({
      bookingId,
      userId: req.user._id,
    });

    if (alreadyReviewedBooking) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this booking',
      });
    }

    const alreadyReviewedSalon = await Review.exists({
      salonId,
      userId: req.user._id,
    });

    if (alreadyReviewedSalon) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this salon',
      });
    }

    const review = await Review.create({
      userId: req.user._id,
      salonId,
      bookingId,
      rating,
      comment: comment?.trim() || undefined,
    });

    const result = await Review.aggregate([
      { $match: { salonId: salon._id } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    await Salon.findByIdAndUpdate(salonId, {
      avgRating: result[0]?.avgRating || 0,
      reviewCount: result[0]?.count || 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this booking or salon',
      });
    }

    console.error('createReview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = req.review;

    if (rating === undefined && comment === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least rating or comment to update',
      });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment?.trim() || undefined;
    }

    await review.save();

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review,
    });
  } catch (error) {
    console.error('updateReview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = req.review;

    await Review.findByIdAndDelete(review._id);

    const result = await Review.aggregate([
      { $match: { salonId: review.salonId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    await Salon.findByIdAndUpdate(review.salonId, {
      avgRating: result[0]?.avgRating || 0,
      reviewCount: result[0]?.count || 0,
    });

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('deleteReview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};

export const getReviewBySalon = async (req, res) => {
  try {
    const { salonId } = req.params;
    const reviews = await Review.find({ salonId });

    return res.status(200).json({
      success: true,
      message: 'Reviews fetched successfully',
      data: reviews,
    });
  } catch (error) {
    console.error('getReviewBySalon error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};

export const getReviewByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await Review.find({ userId });

    return res.status(200).json({
      success: true,
      message: 'Reviews fetched successfully',
      data: reviews,
    });
  } catch (error) {
    console.error('getReviewByUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};

export const replyToReview = async (req, res) => {
  try {
    const review = req.review;
    const { reply } = req.body;

    if (!reply?.text?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required',
      });
    }

    if (review.reply?.text) {
      return res.status(400).json({
        success: false,
        message: 'You have already replied to this review',
      });
    }

    review.reply = {
      text: reply.text.trim(),
      repliedAt: new Date(),
      repliedBy: req.user._id,
    };

    await review.save();

    return res.status(200).json({
      success: true,
      message: 'Reply added successfully',
      data: review,
    });
  } catch (error) {
    console.error('replyToReview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};
