const express = require('express');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'instructor') {
      const courses = await Course.find({ instructor: req.user._id }).sort({ createdAt: -1 });
      return res.json({ courses });
    }

    const courses = await Course.find({ status: 'published' }).sort({ createdAt: -1 }).populate('instructor', 'name');
    return res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

router.post('/', protect, authorize('instructor'), async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }

    const course = await Course.create({
      title,
      description,
      category,
      instructor: req.user._id,
      status: 'draft',
    });

    res.status(201).json({ message: 'Course created', course });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create course' });
  }
});

router.put('/:id', protect, authorize('instructor'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own courses' });
    }

    const { title, description, category } = req.body;

    if (title) course.title = title;
    if (description) course.description = description;
    if (category) course.category = category;

    await course.save();
    res.json({ message: 'Course updated', course });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update course' });
  }
});

router.patch('/:id/publish', protect, authorize('instructor'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only publish your own courses' });
    }

    if (course.status === 'archived') {
      return res.status(400).json({ message: 'Archived courses cannot be published' });
    }

    const lessonCount = await Lesson.countDocuments({ courseId: course._id });
    if (lessonCount === 0) {
      return res.status(400).json({ message: 'Course must have at least one lesson before publishing.' });
    }

    course.status = 'published';
    await course.save();

    res.json({ message: 'Course published', course });
  } catch (error) {
    res.status(500).json({ message: 'Failed to publish course' });
  }
});

router.patch('/:id/archive', protect, authorize('instructor'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only archive your own courses' });
    }

    if (course.status === 'archived') {
      return res.status(400).json({ message: 'Course is already archived' });
    }

    course.status = 'archived';
    await course.save();

    res.json({ message: 'Course archived', course });
  } catch (error) {
    res.status(500).json({ message: 'Failed to archive course' });
  }
});

router.patch('/:id/restore', protect, authorize('instructor'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only restore your own courses' });
    }

    if (course.status !== 'archived') {
      return res.status(400).json({ message: 'Only archived courses can be restored' });
    }

    course.status = 'draft';
    await course.save();

    res.json({ message: 'Course restored to draft', course });
  } catch (error) {
    res.status(500).json({ message: 'Failed to restore course' });
  }
});

module.exports = router;
