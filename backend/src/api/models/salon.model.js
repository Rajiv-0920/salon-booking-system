import mongoose from 'mongoose';

const SalonSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, required: [true, 'Name is required'] },
    address: { type: String, required: [true, 'Address is required'] },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: [true, 'Services is required'],
      },
    ],
    staff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: [true, 'Staff is required'],
      },
    ],
    workingHours: { type: Array, required: true },
    images: [{ type: String, required: true }],
  },
  { timestamps: true },
);

const Salon = mongoose.model('Salon', SalonSchema);

export default Salon;
