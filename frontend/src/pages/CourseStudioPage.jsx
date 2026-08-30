import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import ActivityLogModal from '../components/ActivityLogModal';

const CATEGORIES = [
  'Web Development', 'Compliance', 'Design',
  'Data Science', 'Marketing', 'Leadership',
];

const STATUS_STYLES = {
  published: 'bg-green-500/15 text-green-400 border-green-500/30',
  draft:     'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  archived:  'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

// ─── Course Form Modal ────────────────────────────────────────────────────────
const CourseModal = ({ course, onClose, onSaved }) => {
  const isEdit = !!course;
  const [form, setForm] = useState({
    title:       course?.title       || '',
    description: course?.description || '',
    category:    course?.category    || CATEGORIES[0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = isEdit
        ? await apiClient.put(`/courses/${course._id}`, form)
        : await apiClient.post('/courses', form);
      onSaved(data.course);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-semibold text-lg">{isEdit ? 'Edit Course' : 'New Course'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Intro to React"
              className="w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What will learners gain from this course?"
              className="w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 text-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
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
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



// ─── Course Row ───────────────────────────────────────────────────────────────
const CourseRow = ({ course, onEdit, onStatusAction, onViewLog }) => {
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const doAction = async (action) => {
    setBusy(true);
    setActionError('');
    try {
      await onStatusAction(course._id, action);
    } catch (err) {
      setActionError(err.response?.data?.message || `Failed to ${action}.`);
    } finally {
      setBusy(false);
    }
  };

  const actionButtons = {
    draft:     [{ label: 'Publish', action: 'publish', style: 'text-green-400 border-green-500/40 hover:bg-green-500/10' },
                { label: 'Archive', action: 'archive', style: 'text-slate-400 border-slate-600 hover:bg-slate-700' }],
    published: [{ label: 'Archive', action: 'archive', style: 'text-slate-400 border-slate-600 hover:bg-slate-700' }],
    archived:  [{ label: 'Restore', action: 'restore', style: 'text-purple-400 border-purple-500/40 hover:bg-purple-500/10' }],
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded border ${STATUS_STYLES[course.status]}`}>
              {course.status}
            </span>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{course.category}</span>
          </div>
          <h3 className="text-white font-semibold text-base truncate">{course.title}</h3>
          <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{course.description}</p>
        </div>
      </div>

      {actionError && (
        <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-3">
          {actionError}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        <Link
          to={`/instructor/courses/${course._id}`}
          className="text-xs border border-slate-600 text-slate-300 hover:border-sky-500 hover:text-sky-400 px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          Lessons
        </Link>
        <button
          onClick={() => onEdit(course)}
          className="text-xs border border-slate-600 text-slate-300 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          Edit
        </button>
        <button
          onClick={() => onViewLog(course)}
          className="text-xs border border-slate-600 text-slate-400 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-colors"
        >
          Activity
        </button>

        {(actionButtons[course.status] || []).map(({ label, action, style }) => (
          <button
            key={action}
            onClick={() => doAction(action)}
            disabled={busy}
            className={`text-xs border px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${style}`}
          >
            {busy ? '...' : label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const CourseStudioPage = () => {
  const [courses, setCourses]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modalCourse, setModalCourse] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [logTarget, setLogTarget]     = useState(null);

  const fetchMyCourses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/courses', {
        params: { limit: 100, sortBy: 'createdAt', order: 'desc' },
      });
      setCourses(data.courses || []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMyCourses(); }, [fetchMyCourses]);

  const handleSaved = (savedCourse) => {
    setCourses(prev => {
      const exists = prev.find(c => c._id === savedCourse._id);
      return exists
        ? prev.map(c => c._id === savedCourse._id ? savedCourse : c)
        : [savedCourse, ...prev];
    });
    setModalCourse(undefined);
  };

  const handleStatusAction = async (courseId, action) => {
    const { data } = await apiClient.patch(`/courses/${courseId}/${action}`);
    setCourses(prev => prev.map(c => c._id === courseId ? data.course : c));
  };

  const statCounts = courses.reduce(
    (acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }),
    { draft: 0, published: 0, archived: 0 }
  );

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white">Course Studio</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your courses and their lifecycle.</p>
          </div>
          <button
            onClick={() => setModalCourse(null)}
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
          >
            + New Course
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Draft',     count: statCounts.draft,     color: 'text-yellow-400' },
            { label: 'Published', count: statCounts.published, color: 'text-green-400'  },
            { label: 'Archived',  count: statCounts.archived,  color: 'text-slate-400'  },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-slate-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse h-32" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">No courses yet.</p>
            <button
              onClick={() => setModalCourse(null)}
              className="mt-4 text-sky-400 hover:text-sky-300 text-sm font-medium"
            >
              Create your first course →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.map(course => (
              <CourseRow
                key={course._id}
                course={course}
                onEdit={setModalCourse}
                onStatusAction={handleStatusAction}
                onViewLog={setLogTarget}
              />
            ))}
          </div>
        )}
      </div>

      {modalCourse !== undefined && (
        <CourseModal
          course={modalCourse}
          onClose={() => setModalCourse(undefined)}
          onSaved={handleSaved}
        />
      )}

      {logTarget && (
        <ActivityLogModal
          courseId={logTarget._id}
          courseTitle={logTarget.title}
          onClose={() => setLogTarget(null)}
        />
      )}
    </div>
  );
};

export default CourseStudioPage;
