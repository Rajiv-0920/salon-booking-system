import mongoose from 'mongoose';

const SalonSchema = new mongoose.Schema(
  {
    owner: {
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
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
    staff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
      },
    ],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
      },
    ],

    workingHours: {
      monday: {
        open: { type: String, default: '09:00' },
        close: { type: String, default: '18:00' },
        isClosed: { type: Boolean, default: false },
      },
      tuesday: {
        open: { type: String, default: '09:00' },
        close: { type: String, default: '18:00' },
        isClosed: { type: Boolean, default: false },
      },
      wednesday: {
        open: { type: String, default: '09:00' },
        close: { type: String, default: '18:00' },
        isClosed: { type: Boolean, default: false },
      },
      thursday: {
        open: { type: String, default: '09:00' },
        close: { type: String, default: '18:00' },
        isClosed: { type: Boolean, default: false },
      },
      friday: {
        open: { type: String, default: '09:00' },
        close: { type: String, default: '18:00' },
        isClosed: { type: Boolean, default: false },
      },
      saturday: {
        open: { type: String, default: '10:00' },
        close: { type: String, default: '16:00' },
        isClosed: { type: Boolean, default: false },
      },
      sunday: {
        open: { type: String, default: '00:00' },
        close: { type: String, default: '00:00' },
        isClosed: { type: Boolean, default: true },
      },
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
