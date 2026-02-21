import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: [true, 'Salon is required'],
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required'],
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Staff is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    timeSlot: {
      start: {
        type: String,
        required: [true, 'Start time is required'],
        match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM format'],
      },
      end: {
        type: String,
        required: [true, 'End time is required'],
        match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM format'],
      },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
      default: 'pending',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    cancelledAt: { type: Date },
    confirmedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

// ── Indexes ────────────────────────────────────────────────────────────────
// speeds up overlap detection query
BookingSchema.index({ staffId: 1, date: 1, status: 1 });

// speeds up fetching user's or salon's bookings
BookingSchema.index({ userId: 1, date: -1 });
BookingSchema.index({ salonId: 1, date: -1 });

// ── Auto-set transition timestamps on status change ────────────────────────
BookingSchema.pre('save', function () {
  if (this.isModified('status')) {
    if (this.status === 'confirmed') this.confirmedAt = new Date();
    if (this.status === 'cancelled') this.cancelledAt = new Date();
    if (this.status === 'completed') this.completedAt = new Date();
  }
});

const Booking =
  mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
export default Booking;
