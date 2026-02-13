import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: [true, 'Salon is required'],
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required'],
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Staff is required'],
    },
    date: { type: Date, required: [true, 'Date is required'] },
    time: { type: String, required: [true, 'Time is required'] },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      required: [true, 'Status is required'],
    },
    notes: { type: String },
  },
  { timestamps: true },
);

const Booking = mongoose.model('Booking', BookingSchema);

export default Booking;
