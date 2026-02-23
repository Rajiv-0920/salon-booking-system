import mongoose from 'mongoose';
import Salon from './salon.model.js';

const ReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
    },
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: [true, 'Salon is required'],
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking is required'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Rating is required'],
    },
    comment: { type: String },
    reply: {
      text: String,
      repliedAt: { type: Date },
      repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  },
  { timestamps: true },
);

ReviewSchema.index({ userId: 1, bookingId: 1 }, { unique: true });
ReviewSchema.index({ userId: 1, salonId: 1 }, { unique: true });

ReviewSchema.post('save', async function () {
  const avg = await Review.aggregate([
    { $match: { salonId: this.salonId } },
    {
      $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } },
    },
  ]);

  await Salon.findByIdAndUpdate(this.salonId, {
    avgRating: avg[0]?.avgRating || 0,
    reviewCount: avg[0]?.count || 0,
  });
});

const Review = mongoose.model('Review', ReviewSchema);

export default Review;
