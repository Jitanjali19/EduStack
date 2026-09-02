const express = require('express');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const ActivityLog = require('../models/ActivityLog');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, authorize('instructor'), async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).select('_id title category');
    const courseIds = courses.map((c) => c._id);

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const enrollments = await Enrollment.find({
      courseId: { $in: courseIds },
      status: 'in_progress',
      lastActivityAt: { $lt: fourteenDaysAgo },
    })
      .populate('userId', 'name email')
      .populate('courseId', 'title category status');

    const activeAlerts = enrollments
      .filter((e) => {
        if (!e.dismissedAt) return true;
        return new Date(e.lastActivityAt) > new Date(e.dismissedAt);
      })
      .map((e) => {
        const daysInactive = Math.floor(
          (Date.now() - new Date(e.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          enrollmentId: e._id,
          learner: e.userId,
          course: e.courseId,
          lastActivityAt: e.lastActivityAt,
          daysInactive,
          dismissedAt: e.dismissedAt,
        };
      });

    res.json({
      count: activeAlerts.length,
      alerts: activeAlerts,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch inactivity alerts' });
  }
});

router.post('/dismiss/:enrollmentId', protect, authorize('instructor'), async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId).populate('courseId');
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment record not found' });
    }

    if (enrollment.courseId.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only dismiss alerts for your own courses' });
    }

    enrollment.dismissedAt = new Date();
    await enrollment.save();

    await ActivityLog.create({
      courseId: enrollment.courseId._id,
      actorId: req.user._id,
      action: 'edit',
      details: `Instructor dismissed inactivity alert for learner ID ${enrollment.userId}`,
    }).catch((err) => console.error(err.message));

    res.json({
      message: 'Inactivity alert dismissed',
      enrollmentId: enrollment._id,
      dismissedAt: enrollment.dismissedAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to dismiss inactivity alert' });
  }
});

module.exports = router;
