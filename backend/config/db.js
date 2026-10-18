const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set. Copy backend/.env.example to backend/.env and configure it.');
    }

    if (process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
      // Some local DNS resolvers return malformed SRV replies for Atlas.
      dns.setServers([process.env.MONGODB_DNS_SERVER || '1.1.1.1']);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
