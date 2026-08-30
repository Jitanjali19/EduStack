const express = require('express');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const ActivityLog = require('../models/ActivityLog');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

const logCourseAction = async (courseId, actorId, action, details) => {
  try {
    await ActivityLog.create({ courseId, actorId, action, details });
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
  }
};

router.get('/', protect, async (req, res) => {
  try {
    const {
      search,
      category,
      status,
      instructor,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const sortDirection = order === 'asc' ? 1 : -1;

    const matchFilter = {};

    if (req.user.role === 'learner') {
      matchFilter.status = 'published';
    } else if (status) {
      matchFilter.status = status;
    }

    if (category) {
      matchFilter.category = category;
    }

    if (instructor && mongoose.Types.ObjectId.isValid(instructor)) {
      matchFilter.instructor = new mongoose.Types.ObjectId(instructor);
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      matchFilter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const sortFieldMap = {
      title: 'title',
      createdAt: 'createdAt',
      enrollmentCount: 'enrollmentCount',
    };
    const sortField = sortFieldMap[sortBy] || 'createdAt';

    const pipeline = [
      { $match: matchFilter },
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'courseId',
          as: 'enrollments',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'instructor',
          foreignField: '_id',
          as: 'instructorInfo',
        },
      },
      {
        $unwind: {
          path: '$instructorInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          enrollmentCount: { $size: '$enrollments' },
          instructor: {
            _id: '$instructorInfo._id',
            name: '$instructorInfo.name',
            email: '$instructorInfo.email',
          },
        },
      },
      {
        $project: {
          enrollments: 0,
          instructorInfo: 0,
        },
      },
      {
        $facet: {
          data: [
            { $sort: { [sortField]: sortDirection } },
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];

    const results = await Course.aggregate(pipeline);
    const courses = results[0].data || [];
    const total = results[0].totalCount[0]?.count || 0;

    res.json({
      courses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Course fetch error:', error.message);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'name email');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role === 'learner' && course.status !== 'published') {
      return res.status(403).json({ message: 'This course is not published' });
    }

    res.json({ course });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch course' });
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

    await logCourseAction(course._id, req.user._id, 'create', `Created course '${title}' in category '${category}'`);

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

    const changes = [];
    if (title && title !== course.title) {
      changes.push(`title: '${course.title}' -> '${title}'`);
      course.title = title;
    }
    if (description && description !== course.description) {
      changes.push(`updated description`);
      course.description = description;
    }
    if (category && category !== course.category) {
      changes.push(`category: '${course.category}' -> '${category}'`);
      course.category = category;
    }

    await course.save();

    if (changes.length > 0) {
      await logCourseAction(course._id, req.user._id, 'edit', `Edited course: ${changes.join(', ')}`);
    }

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

    await logCourseAction(course._id, req.user._id, 'publish', `Published course with ${lessonCount} lesson(s)`);

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

    await logCourseAction(course._id, req.user._id, 'archive', 'Archived course from catalog');

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

    await logCourseAction(course._id, req.user._id, 'restore', 'Restored course back to draft');

    res.json({ message: 'Course restored to draft', course });
  } catch (error) {
    res.status(500).json({ message: 'Failed to restore course' });
  }
});

router.get('/:id/activity', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const activity = await ActivityLog.find({ courseId: req.params.id })
      .populate('actorId', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ courseId: req.params.id, activity });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch course activity log' });
  }
});

router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const logEntry = await ActivityLog.create({
      courseId: course._id,
      actorId: req.user._id,
      action: 'comment',
      details: comment.trim(),
    });

    res.status(201).json({ message: 'Comment recorded in activity history', logEntry });
  } catch (error) {
    res.status(500).json({ message: 'Failed to post comment' });
  }
});

module.exports = router;
