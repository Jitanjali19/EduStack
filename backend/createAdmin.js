require('dotenv').config();

const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

const createAdmin = async () => {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Platform Admin';

  if (!email || !password || password.length < 8) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 8 characters).');
  }

  await connectDB();

  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin && existingAdmin.email !== email) {
    throw new Error(`An admin already exists: ${existingAdmin.email}`);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.role !== 'admin') {
    throw new Error('That email already belongs to a non-admin user.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = existingAdmin || existingUser || new User({ email });
  admin.name = name;
  admin.email = email;
  admin.password = hashedPassword;
  admin.role = 'admin';
  await admin.save();

  console.log(`Admin ready: ${admin.email}`);
  await User.db.close();
};

createAdmin().catch((error) => {
  console.error(`Admin setup failed: ${error.message}`);
  process.exitCode = 1;
});
