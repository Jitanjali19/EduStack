const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const getDashboardMetrics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalLearners, publishedCourses, completionsThisMonth, learnersInProgress] = await Promise.all([
      User.countDocuments({ role: 'learner' }),
      Course.countDocuments({ status: 'published' }),
      Enrollment.countDocuments({ status: 'completed', completedAt: { $gte: startOfMonth } }),
      Enrollment.countDocuments({ status: 'in_progress' }),
    ]);

    const courses = await Course.find({}, 'title category status');
    const enrollments = await Enrollment.find({});

    const courseBreakdown = courses.map((course) => {
      const courseEnrollments = enrollments.filter(
        (e) => e.courseId.toString() === course._id.toString()
      );
      return {
        courseId: course._id,
        title: course.title,
        category: course.category,
        status: course.status,
        totalEnrollments: courseEnrollments.length,
        notStarted: courseEnrollments.filter((e) => e.status === 'not_started').length,
        inProgress: courseEnrollments.filter((e) => e.status === 'in_progress').length,
        completed: courseEnrollments.filter((e) => e.status === 'completed').length,
      };
    });

    const overallProgressBreakdown = {
      not_started: enrollments.filter((e) => e.status === 'not_started').length,
      in_progress: enrollments.filter((e) => e.status === 'in_progress').length,
      completed: enrollments.filter((e) => e.status === 'completed').length,
    };

    const completionTrend = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const count = enrollments.filter((e) => {
        if (e.status !== 'completed' || !e.completedAt) return false;
        const date = new Date(e.completedAt);
        return date >= weekStart && date < weekEnd;
      }).length;

      completionTrend.push({
        weekIndex: 8 - i,
        weekLabel: `Week ${8 - i}`,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        completionsCount: count,
      });
    }

    res.json({
      headline: {
        totalLearners,
        publishedCourses,
        completionsThisMonth,
        learnersInProgress,
      },
      breakdownByCourse: courseBreakdown,
      overallProgressBreakdown,
      eightWeekCompletionTrend: completionTrend,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard metrics' });
  }
};

router.get('/', protect, getDashboardMetrics);
router.get('/metrics', protect, getDashboardMetrics);

module.exports = router;
