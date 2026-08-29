const express = require('express');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const ALLOWED_STATUS_TRANSITIONS = {
  not_started: ['in_progress'],
  in_progress: ['completed'],
  completed: [],
};

// @route   POST /api/enrollments/enroll/:courseId
// @desc    Enroll in a published course
router.post('/enroll/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    let targetUserId = req.user._id;

    if (req.user.role === 'instructor' && req.body.userId) {
      const targetUser = await User.findById(req.body.userId);
      if (!targetUser) {
        return res.status(404).json({ message: 'Target learner not found' });
      }
      targetUserId = targetUser._id;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.status !== 'published') {
      return res.status(400).json({ message: 'Cannot enroll in an unpublished course' });
    }

    const existingEnrollment = await Enrollment.findOne({
      userId: targetUserId,
      courseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'User is already enrolled in this course' });
    }

    const enrollment = await Enrollment.create({
      userId: targetUserId,
      courseId,
      status: 'not_started',
      completedLessons: [],
      enrolledAt: new Date(),
      lastActivityAt: new Date(),
    });

    await ActivityLog.create({
      courseId,
      actorId: req.user._id,
      action: 'enrolled',
      details: `Learner enrolled in course`,
    }).catch((err) => console.error('Activity log error:', err.message));

    res.status(201).json({
      message: 'Enrolled successfully',
      enrollment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User is already enrolled in this course' });
    }
    res.status(500).json({ message: 'Failed to enroll in course' });
  }
});

// @route   GET /api/enrollments/my-courses
// @desc    Get all courses the logged-in learner is enrolled in with search/filter/pagination
router.get('/my-courses', protect, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    const filter = { userId: req.user._id };
    if (status) {
      filter.status = status;
    }

    let enrollments = await Enrollment.find(filter)
      .populate({
        path: 'courseId',
        populate: { path: 'instructor', select: 'name email' },
      })
      .sort({ enrolledAt: -1 });

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      enrollments = enrollments.filter(
        (e) =>
          e.courseId &&
          (e.courseId.title?.toLowerCase().includes(term) ||
            e.courseId.category?.toLowerCase().includes(term))
      );
    }

    const total = enrollments.length;
    const paginated = enrollments.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      enrollments: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch enrolled courses' });
  }
});

// @route   GET /api/enrollments/course/:courseId
// @desc    Get enrollment details / roster for a course with search, filter, and pagination
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    if (req.user.role === 'instructor') {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      if (course.instructor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { status, search, page = 1, limit = 20 } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

      const filter = { courseId };
      if (status) {
        filter.status = status;
      }

      let enrollments = await Enrollment.find(filter)
        .populate('userId', 'name email role')
        .sort({ enrolledAt: -1 });

      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        enrollments = enrollments.filter(
          (e) =>
            e.userId &&
            (e.userId.name?.toLowerCase().includes(term) ||
              e.userId.email?.toLowerCase().includes(term))
        );
      }

      const total = enrollments.length;
      const paginated = enrollments.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      return res.json({
        total,
        enrollments: paginated,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      });
    }

    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId,
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }

    const totalLessons = await Lesson.countDocuments({ courseId });
    const completedCount = enrollment.completedLessons.length;
    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    res.json({
      enrollment,
      progress: {
        totalLessons,
        completedLessonsCount: completedCount,
        progressPercent,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch enrollment details' });
  }
});

// @route   PATCH /api/enrollments/course/:courseId/lesson/:lessonId/complete
// @desc    Mark a lesson completed & apply course completion rules
router.patch('/course/:courseId/lesson/:lessonId/complete', protect, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId,
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'You are not enrolled in this course' });
    }

    const lesson = await Lesson.findOne({ _id: lessonId, courseId });
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found in this course' });
    }

    const alreadyCompleted = enrollment.completedLessons.some(
      (id) => id.toString() === lessonId.toString()
    );

    if (!alreadyCompleted) {
      enrollment.completedLessons.push(lesson._id);
    }

    enrollment.lastActivityAt = new Date();

    const allLessons = await Lesson.find({ courseId }).select('_id');
    const totalLessons = allLessons.length;
    const allLessonIdSet = new Set(allLessons.map((l) => l._id.toString()));

    const validCompleted = enrollment.completedLessons.filter((id) =>
      allLessonIdSet.has(id.toString())
    );

    const wasCompletedBefore = enrollment.status === 'completed';

    if (totalLessons > 0 && validCompleted.length >= totalLessons) {
      enrollment.status = 'completed';
      if (!enrollment.completedAt) {
        enrollment.completedAt = new Date();
      }

      if (!wasCompletedBefore) {
        await ActivityLog.create({
          courseId,
          actorId: req.user._id,
          action: 'completed',
          details: `Learner completed all ${totalLessons} lessons in course`,
        }).catch((err) => console.error('Activity log error:', err.message));
      }
    } else if (validCompleted.length > 0 && enrollment.status === 'not_started') {
      enrollment.status = 'in_progress';
    }

    await enrollment.save();

    const completedCount = validCompleted.length;
    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    res.json({
      message: 'Lesson marked as completed',
      enrollment,
      progress: {
        totalLessons,
        completedLessonsCount: completedCount,
        progressPercent,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update lesson progress' });
  }
});

// @route   PATCH /api/enrollments/course/:courseId/status
// @desc    Direct progress state transition with strict completion validation rules
router.patch('/course/:courseId/status', protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { status } = req.body;

    const enrollment = await Enrollment.findOne({
      userId: req.user._id,
      courseId,
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }

    if (enrollment.status === status) {
      return res.json({ message: 'Status unchanged', enrollment });
    }

    const allowedNext = ALLOWED_STATUS_TRANSITIONS[enrollment.status] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        message: `Invalid progress transition from '${enrollment.status}' to '${status}'. Progress moves strictly: Not Started -> In Progress -> Completed.`,
      });
    }

    if (status === 'completed') {
      const allLessons = await Lesson.find({ courseId }).select('_id');
      const totalLessons = allLessons.length;

      if (totalLessons === 0) {
        return res.status(400).json({ message: 'Cannot mark course as completed because it has no lessons' });
      }

      const allLessonIdSet = new Set(allLessons.map((l) => l._id.toString()));
      const validCompleted = enrollment.completedLessons.filter((id) =>
        allLessonIdSet.has(id.toString())
      );

      if (validCompleted.length < totalLessons) {
        return res.status(400).json({
          message: `Cannot complete course. ${totalLessons - validCompleted.length} of ${totalLessons} lessons are still pending.`,
        });
      }
    }

    enrollment.status = status;
    enrollment.lastActivityAt = new Date();

    if (status === 'completed' && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
      await ActivityLog.create({
        courseId,
        actorId: req.user._id,
        action: 'completed',
        details: `Learner marked course as completed`,
      }).catch((err) => console.error('Activity log error:', err.message));
    }

    await enrollment.save();

    res.json({
      message: `Progress status updated to ${status}`,
      enrollment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update progress status' });
  }
});

module.exports = router;
