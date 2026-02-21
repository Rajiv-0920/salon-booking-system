import mongoose from 'mongoose';
import workingHoursSchema from './workingHours.model.js';

const SalonSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A salon must have an owner'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Salon name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Physical address is required'],
    },
    holidays: [
      {
        type: Date,
      },
    ],
    isAvailable: {
      type: Boolean,
      default: true,
    },
    // reviewsId: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Review',
    //   },
    // ],
    // bookingsId: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Booking',
    //   },
    // ],

    workingHours: {
      type: workingHoursSchema,
      default: () => ({}),
    },

    images: { type: [String], default: [] },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'], // Must be 'Point'
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
  },
  { timestamps: true },
);

SalonSchema.index({ location: '2dsphere' });

const Salon = mongoose.model('Salon', SalonSchema);

export default Salon;
