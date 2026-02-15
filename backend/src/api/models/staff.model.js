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
  },
  { timestamps: true },
);

const Staff = mongoose.model('Staff', StaffSchema);

export default Staff;
