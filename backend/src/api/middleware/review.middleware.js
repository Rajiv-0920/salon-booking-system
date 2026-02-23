import Review from '../models/review.model.js';

export const verifyReviewOwnership = async (req, res, next) => {
  const { id } = req.params;
  const review = await Review.findById(id);

  if (!review) {
    return res.status(404).json({ message: 'No review found with that ID' });
  }

  if (review.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You do not own this review' });
  }

  req.review = review;
  next();
};

export const verifyReviewSalonOwnership = async (req, res, next) => {
  const { id } = req.params;
  const review = await Review.findById(id);

  if (!review) {
    return res.status(404).json({ message: 'No review found with that ID' });
  }

  if (review.salonId.toString() !== req.user.salonId.toString()) {
    return res.status(403).json({ message: 'You do not own this review' });
  }

  req.review = review;
  next();
};
