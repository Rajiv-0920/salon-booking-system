import mongoose from 'mongoose';
import Service from './api/models/services.model.js';
import Staff from './api/models/staff.model.js';
import Booking from './api/models/booking.model.js';
// import dotenv from 'dotenv'; // Uncomment if using .env
// dotenv.config();

const MONGO_URI =
  'mongodb+srv://rajivkumar8163_db_user:FjxTJU6yJYs1GdXJ@cluster0.wiqlpsa.mongodb.net/salon_db?appName=Cluster0'; // Or your Atlas URI

const seedDatabase = async () => {
  try {
    // 1. MUST Connect to MongoDB first
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    const salonId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    // 2. Create Service
    const service = await Service.create({
      name: 'Haircut & Styling',
      description: 'Premium cut and style',
      duration: 60,
      price: 50,
      salon: salonId,
    });

    // 3. Create Staff
    const staff = await Staff.create({
      salon: salonId,
      name: 'John Doe',
      specialties: ['Cutting'],
      workingHours: {
        monday: { open: '09:00', close: '17:00', isClosed: false },
        // ... include other days as needed
      },
    });

    // 4. Create Booking
    await Booking.create({
      user: userId,
      salon: salonId,
      staff: staff._id,
      service: service._id,
      date: new Date('2026-02-16'),
      time: '10:00',
      status: 'confirmed',
    });

    console.log('✅ Seeding complete!');
    console.log(`Copy this Staff ID for testing: ${staff._id}`);
    console.log(`Copy this Service ID for testing: ${service._id}`);

    // 5. Close connection and exit
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
