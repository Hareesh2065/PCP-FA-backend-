import app from './app.js';
import mongoose from 'mongoose';
import User from './models/userModel.js';

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bug-tracker';

// Seed initial admin user if it does not exist
const seedAdminUser = async () => {
  try {
    const adminEmail = 'admin@example.com';
    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      console.log('Seeding default administrator...');
      await User.create({
        name: 'Administrator',
        email: adminEmail,
        password: 'password', // Will be automatically hashed by pre-save hook
      });
      console.log(`Default administrator seeded: ${adminEmail} / password`);
    } else {
      console.log('Administrator account already exists.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
  }
};

// Connect to MongoDB & Start Server
const startServer = async () => {
  try {
    console.log('Connecting to MongoDB...');
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connection established successfully.');

    // Run admin seed
    await seedAdminUser();

    app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB database connection error:', error.message);
    console.log('Shutting down server startup...');
    process.exit(1);
  }
};

startServer();
