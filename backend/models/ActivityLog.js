const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['create', 'edit', 'publish', 'archive', 'restore', 'lesson_add', 'lesson_edit', 'lesson_delete', 'enrolled', 'completed', 'comment'],
    },
    details: {
      type: String,
      default: '',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'], function () {
  throw new Error('Activity log records are immutable and cannot be edited or deleted.');
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
