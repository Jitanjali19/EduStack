const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, authorize('admin'));

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.post('/instructors', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({ message: 'Name, email, and a password of at least 8 characters are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'A user already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const instructor = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'instructor',
    });

    res.status(201).json({
      message: 'Instructor created successfully',
      instructor: { _id: instructor._id, name: instructor.name, email: instructor.email, role: instructor.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create instructor' });
  }
});

module.exports = router;
