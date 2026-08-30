require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Course = require('./models/Course');
const Lesson = require('./models/Lesson');
const Enrollment = require('./models/Enrollment');
const ActivityLog = require('./models/ActivityLog');

const seedData = async () => {
  try {
    await connectDB();

    await Enrollment.deleteMany({});
    await Lesson.deleteMany({});
    await ActivityLog.deleteMany({});
    await Course.deleteMany({});
    await User.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123!', salt);

    const instructor = await User.create({
      name: 'Sarah Instructor',
      email: 'instructor@example.com',
      password: hashedPassword,
      role: 'instructor',
    });

    const learner1 = await User.create({
      name: 'Alex Learner',
      email: 'learner@example.com',
      password: hashedPassword,
      role: 'learner',
    });

    const learner2 = await User.create({
      name: 'Jordan Learner',
      email: 'learner2@example.com',
      password: hashedPassword,
      role: 'learner',
    });

    const course1 = await Course.create({
      title: 'Fullstack Web Development Core',
      description: 'Comprehensive onboarding course for fullstack engineering practices.',
      category: 'Web Development',
      status: 'published',
      instructor: instructor._id,
    });

    const course2 = await Course.create({
      title: 'Security & Compliance 101',
      description: 'Mandatory company compliance and security policies.',
      category: 'Compliance',
      status: 'published',
      instructor: instructor._id,
    });

    const lesson1 = await Lesson.create({
      courseId: course1._id,
      title: 'Introduction to Express & Node.js',
      content: 'Core architecture and middleware patterns.',
      position: 1,
    });

    const lesson2 = await Lesson.create({
      courseId: course1._id,
      title: 'MongoDB & Mongoose Data Modeling',
      content: 'Schema design and aggregation pipelines.',
      position: 2,
    });

    const lesson3 = await Lesson.create({
      courseId: course2._id,
      title: 'Data Privacy & Password Hashing',
      content: 'Bcrypt hashing and secure authentication flows.',
      position: 1,
    });

    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);

    await Enrollment.create({
      userId: learner1._id,
      courseId: course1._id,
      status: 'in_progress',
      completedLessons: [lesson1._id],
      enrolledAt: twentyDaysAgo,
      lastActivityAt: twentyDaysAgo,
    });

    await Enrollment.create({
      userId: learner2._id,
      courseId: course2._id,
      status: 'completed',
      completedLessons: [lesson3._id],
      enrolledAt: new Date(),
      lastActivityAt: new Date(),
      completedAt: new Date(),
    });

    await ActivityLog.create({
      courseId: course1._id,
      actorId: instructor._id,
      action: 'publish',
      details: 'Published course Fullstack Web Development Core',
    });

    console.log('Seed completed successfully');
    console.log('Instructor Demo Credential: instructor@example.com / Password123!');
    console.log('Learner Demo Credential: learner@example.com / Password123!');
    process.exit(0);
  } catch (error) {
    console.error('Seed script error:', error.message);
    process.exit(1);
  }
};

seedData();
