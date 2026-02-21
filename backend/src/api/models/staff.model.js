import mongoose from 'mongoose';
import workingHoursSchema from './workingHours.model.js';

const StaffSchema = new mongoose.Schema(
  {
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: [true, 'Salon is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    name: { type: String, required: [true, 'Name is required'] },
    specialties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialty',
        required: [true, 'Specialties are required'],
      },
    ],
    workingHours: {
      type: workingHoursSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

const Staff = mongoose.model('Staff', StaffSchema);

export default Staff;
