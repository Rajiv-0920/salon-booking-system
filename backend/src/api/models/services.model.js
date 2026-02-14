import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema(
  {
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: [true, 'Salon is required'],
    },
    name: { type: String, required: [true, 'Name is required'] },
    duration: { type: Number, required: [true, 'Duration is required'] },
    price: { type: Number, required: [true, 'Price is required'] },
    description: { type: String, required: [true, 'Description is required'] },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
  },
  { timestamps: true },
);

const Service = mongoose.model('Service', ServiceSchema);

export default Service;
