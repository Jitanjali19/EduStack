import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import ActivityLogModal from '../components/ActivityLogModal';

// ─── Lesson Form Modal ────────────────────────────────────────────────────────
const LessonModal = ({ lesson, onClose, onSaved }) => {
  const isEdit = !!lesson;
  const [form, setForm] = useState({
    title: lesson?.title || '',
    content: lesson?.content || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSaved(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save lesson.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-semibold text-lg">{isEdit ? 'Edit Lesson' : 'Add New Lesson'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Lesson Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. 1. Introduction to State Management"
              className="w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Lesson Content</label>
            <textarea
              required
              rows={6}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Detailed explanation, code examples, or instructional reading material..."
              className="w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Lesson Manager Page ──────────────────────────────────────────────────
const LessonManagerPage = () => {
  const { id: courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalLesson, setModalLesson] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showActivity, setShowActivity] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get(`/lessons/course/${courseId}`);
      setCourse(data.course);
      setLessons(data.lessons || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch course lessons.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add / Edit Lesson Handler
  const handleSaveLesson = async (formData) => {
    if (modalLesson) {
      // Edit
      const { data } = await apiClient.put(`/lessons/course/${courseId}/${modalLesson._id}`, formData);
      setLessons(prev => prev.map(l => l._id === modalLesson._id ? data.lesson : l));
    } else {
      // Create
      const { data } = await apiClient.post(`/lessons/course/${courseId}`, formData);
      setLessons(prev => [...prev, data.lesson]);
    }
  };

  // Delete Lesson Handler
  const handleDeleteLesson = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/lessons/course/${courseId}/${deleteTarget._id}`);
      setLessons(prev => prev.filter(l => l._id !== deleteTarget._id));
      setDeleteTarget(null);
      // Re-fetch to guarantee updated positions
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete lesson');
    } finally {
      setIsDeleting(false);
    }
  };

  // Move Position & Reorder Handlers
  const moveLesson = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= lessons.length || fromIndex === toIndex) return;

    const newLessons = [...lessons];
    const [moved] = newLessons.splice(fromIndex, 1);
    newLessons.splice(toIndex, 0, moved);

    // Optimistic UI update
    setLessons(newLessons);

    setIsReordering(true);
    try {
      const orderedLessonIds = newLessons.map(l => l._id);
      const { data } = await apiClient.patch(`/lessons/course/${courseId}/reorder`, { orderedLessonIds });
      setLessons(data.lessons);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to persist reordering');
      fetchData(); // Rollback
    } finally {
      setIsReordering(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    moveLesson(draggedIndex, targetIndex);
    setDraggedIndex(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse text-sm">Loading course lessons...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <Link to="/instructor/courses" className="text-sky-400 hover:text-sky-300 text-sm">
            ← Back to Course Studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Breadcrumbs & Actions */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link
              to="/instructor/courses"
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors mb-2 inline-block"
            >
              ← Back to Course Studio
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
              {course?.title || 'Lesson Manager'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'} · Drag or use arrows to reorder
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowActivity(true)}
              className="border border-slate-700 hover:border-slate-500 text-slate-300 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors shrink-0"
            >
              📜 Activity Log
            </button>
            <button
              onClick={() => setModalLesson(null)}
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0 shadow-lg shadow-sky-600/20"
            >
              + Add Lesson
            </button>
          </div>
        </div>

        {/* Reordering indicator */}
        {isReordering && (
          <div className="bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs px-4 py-2 rounded-lg mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            Saving updated lesson positions...
          </div>
        )}

        {/* Lesson List */}
        {lessons.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-base font-medium">No lessons in this course yet.</p>
            <p className="text-slate-600 text-sm mt-1 mb-6">
              Courses must have at least one lesson before they can be published.
            </p>
            <button
              onClick={() => setModalLesson(null)}
              className="bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              Add First Lesson
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, idx) => (
              <div
                key={lesson._id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                className={`bg-slate-900 border rounded-xl p-4 transition-all duration-150 flex items-center gap-4 ${
                  draggedIndex === idx
                    ? 'border-sky-500 bg-slate-800/80 opacity-60 scale-[0.99]'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Drag Handle & Position Indicator */}
                <div
                  title="Drag to reorder"
                  className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 px-1 py-2 select-none"
                >
                  ⠿
                </div>

                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs shrink-0">
                  {idx + 1}
                </div>

                {/* Lesson Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm sm:text-base truncate">{lesson.title}</h3>
                  <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{lesson.content}</p>
                </div>

                {/* Move & Action Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Move Up Button */}
                  <button
                    onClick={() => moveLesson(idx, idx - 1)}
                    disabled={idx === 0}
                    title="Move Up"
                    className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ▲
                  </button>

                  {/* Move Down Button */}
                  <button
                    onClick={() => moveLesson(idx, idx + 1)}
                    disabled={idx === lessons.length - 1}
                    title="Move Down"
                    className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ▼
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => setModalLesson(lesson)}
                    className="text-xs border border-slate-700 hover:border-slate-500 text-slate-300 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Edit
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => setDeleteTarget(lesson)}
                    className="text-xs border border-slate-700 hover:border-red-500/50 hover:text-red-400 text-slate-400 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalLesson !== undefined && (
        <LessonModal
          lesson={modalLesson}
          onClose={() => setModalLesson(undefined)}
          onSaved={handleSaveLesson}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-white font-semibold text-lg mb-2">Delete Lesson</h3>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to delete <span className="text-white font-medium">"{deleteTarget.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteLesson}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log Modal */}
      {showActivity && (
        <ActivityLogModal
          courseId={courseId}
          courseTitle={course?.title}
          onClose={() => setShowActivity(false)}
        />
      )}
    </div>
  );
};

export default LessonManagerPage;
