const express = require('express');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

const ensureCourseOwnership = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId || req.body.courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only manage lessons for your own course' });
    }

    req.course = course;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Failed to validate course ownership' });
  }
};

const normalizeLessonPositions = async (courseId) => {
  const lessons = await Lesson.find({ courseId }).sort({ position: 1, createdAt: 1 });

  for (let i = 0; i < lessons.length; i++) {
    if (lessons[i].position !== i + 1) {
      lessons[i].position = i + 1;
      await lessons[i].save();
    }
  }
};

router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role === 'instructor' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot view lessons for another instructor course' });
    }

    if (req.user.role === 'learner' && course.status !== 'published') {
      return res.status(403).json({ message: 'This course is not public yet' });
    }

    const lessons = await Lesson.find({ courseId: course._id }).sort({ position: 1, createdAt: 1 });
    res.json({ course, lessons });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch lessons' });
  }
});

router.post('/course/:courseId', protect, authorize('instructor'), ensureCourseOwnership, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Lesson title and content are required' });
    }

    const position = await Lesson.countDocuments({ courseId: req.params.courseId }) + 1;

    const lesson = await Lesson.create({
      courseId: req.params.courseId,
      title,
      content,
      position,
    });

    res.status(201).json({ message: 'Lesson created', lesson });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create lesson' });
  }
});

router.put('/course/:courseId/:lessonId', protect, authorize('instructor'), ensureCourseOwnership, async (req, res) => {
  try {
    const lesson = await Lesson.findOne({ _id: req.params.lessonId, courseId: req.params.courseId });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const { title, content } = req.body;
    if (title) lesson.title = title;
    if (content) lesson.content = content;

    await lesson.save();
    res.json({ message: 'Lesson updated', lesson });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update lesson' });
  }
});

router.delete('/course/:courseId/:lessonId', protect, authorize('instructor'), ensureCourseOwnership, async (req, res) => {
  try {
    const lesson = await Lesson.findOne({ _id: req.params.lessonId, courseId: req.params.courseId });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    await lesson.deleteOne();
    await normalizeLessonPositions(req.params.courseId);

    res.json({ message: 'Lesson deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete lesson' });
  }
});

router.patch('/course/:courseId/reorder', protect, authorize('instructor'), ensureCourseOwnership, async (req, res) => {
  try {
    const { orderedLessonIds } = req.body;

    if (!Array.isArray(orderedLessonIds) || orderedLessonIds.length === 0) {
      return res.status(400).json({ message: 'orderedLessonIds array is required' });
    }

    const lessons = await Lesson.find({ courseId: req.params.courseId });
    const lessonMap = new Map(lessons.map((lesson) => [lesson._id.toString(), lesson]));

    for (let i = 0; i < orderedLessonIds.length; i++) {
      const lesson = lessonMap.get(orderedLessonIds[i]);
      if (!lesson) {
        return res.status(400).json({ message: 'Invalid lesson id in reorder list' });
      }
      lesson.position = i + 1;
      await lesson.save();
    }

    const updatedLessons = await Lesson.find({ courseId: req.params.courseId }).sort({ position: 1, createdAt: 1 });
    res.json({ message: 'Lessons reordered', lessons: updatedLessons });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reorder lessons' });
  }
});

module.exports = router;
