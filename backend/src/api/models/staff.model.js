import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema(
  {
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: [true, 'Salon is required'],
    },
    name: { type: String, required: [true, 'Name is required'] },
    specialties: [
      { type: String, required: [true, 'Specialties are required'] },
    ],
    workingHours: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkingHours',
      required: [true, 'Working hours are required'],
    },
  },
  { timestamps: true },
);

const Staff = mongoose.model('Staff', StaffSchema);

export default Staff;
