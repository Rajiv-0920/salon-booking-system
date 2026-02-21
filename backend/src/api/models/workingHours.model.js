import mongoose from 'mongoose';

const daySchema = new mongoose.Schema(
  {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '18:00' },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false },
);

const workingHoursSchema = new mongoose.Schema(
  {
    monday: { type: daySchema, default: () => ({}) },
    tuesday: { type: daySchema, default: () => ({}) },
    wednesday: { type: daySchema, default: () => ({}) },
    thursday: { type: daySchema, default: () => ({}) },
    friday: { type: daySchema, default: () => ({}) },
    saturday: {
      type: daySchema,
      default: () => ({ open: '10:00', close: '16:00' }),
    },
    sunday: {
      type: daySchema,
      default: () => ({ open: '00:00', close: '00:00', isClosed: true }),
    },
  },
  { _id: false },
);

export default workingHoursSchema;
