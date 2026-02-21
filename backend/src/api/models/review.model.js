import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    customerId: {
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
    reply: { type: String },
  },
  { timestamps: true },
);

const Review = mongoose.model('Review', ReviewSchema);

export default Review;
