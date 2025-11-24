const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // MongoDB connection success message will be handled in server.js

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    // During tests we don't want to forcibly exit the process; throw or return.
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
      // Let the test harness handle connection failures.
      return;
    }
    process.exit(1);
  }
};

module.exports = connectDB;