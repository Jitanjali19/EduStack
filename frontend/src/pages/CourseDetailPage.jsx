import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const StatusBadge = ({ status }) => {
  const styles = {
    published: 'bg-green-500/15 text-green-400 border border-green-500/30',
    draft: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    archived: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  };
  return (
    <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
};

const CourseDetailPage = () => {
  const { id } = useParams();
  const { isInstructor, isLearner } = useAuth();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [enrollMsg, setEnrollMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [courseRes, lessonsRes] = await Promise.all([
          apiClient.get(`/courses/${id}`),
          apiClient.get(`/lessons/course/${id}`),
        ]);
        setCourse(courseRes.data.course);
        setLessons(lessonsRes.data.lessons || []);

        if (isLearner) {
          try {
            const enrollRes = await apiClient.get(`/enrollments/course/${id}`);
            setEnrollment(enrollRes.data.enrollment);
          } catch {
            setEnrollment(null);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load course.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isLearner]);

  const handleEnroll = async () => {
    setEnrolling(true);
    setEnrollMsg('');
    try {
      const res = await apiClient.post(`/enrollments/enroll/${id}`);
      setEnrollment(res.data.enrollment);
      setEnrollMsg('You have been enrolled successfully!');
    } catch (err) {
      setEnrollMsg(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse text-sm">Loading course...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <Link to="/courses" className="text-sky-400 hover:text-sky-300 text-sm">← Back to Catalog</Link>
        </div>
      </div>
    );
  }

  const progressBadge = {
    not_started: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
    in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    completed: 'bg-green-500/20 text-green-400 border-green-500/40',
  };

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/courses" className="text-slate-500 hover:text-slate-300 text-sm transition-colors mb-6 inline-block">
          ← Back to Catalog
        </Link>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge status={course.status} />
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{course.category}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug">{course.title}</h1>
            </div>

            {isLearner && course.status === 'published' && (
              <div className="flex flex-col items-end gap-2 shrink-0">
                {enrollment ? (
                  <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full border ${progressBadge[enrollment.status]}`}>
                    {enrollment.status.replace('_', ' ')}
                  </span>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}
                {enrollMsg && (
                  <p className={`text-xs ${enrollMsg.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                    {enrollMsg}
                  </p>
                )}
              </div>
            )}

            {isInstructor && (
              <Link
                to={`/instructor/courses/${id}`}
                className="text-sm font-medium border border-slate-600 hover:border-sky-500 hover:text-sky-400 text-slate-300 px-4 py-2 rounded-lg transition-colors shrink-0"
              >
                Edit Course
              </Link>
            )}
          </div>

          <p className="text-slate-400 text-sm leading-relaxed mb-6">{course.description}</p>

          <div className="flex flex-wrap gap-6 text-sm border-t border-slate-800 pt-5">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Instructor</p>
              <p className="text-slate-200 font-medium">{course.instructor?.name || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Lessons</p>
              <p className="text-slate-200 font-medium">{lessons.length}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Created</p>
              <p className="text-slate-200 font-medium">{new Date(course.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">
            Course Lessons
            <span className="ml-2 text-slate-500 text-sm font-normal">({lessons.length})</span>
          </h2>

          {lessons.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">No lessons have been added yet.</p>
          ) : (
            <ol className="space-y-2">
              {lessons.map((lesson, idx) => {
                const isCompleted = enrollment?.completedLessons?.includes(lesson._id);
                return (
                  <li
                    key={lesson._id}
                    className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCompleted
                        ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                        : 'bg-slate-700 text-slate-400 border border-slate-600'
                    }`}>
                      {isCompleted ? '✓' : idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm font-medium truncate">{lesson.title}</p>
                      {lesson.content && (
                        <p className="text-slate-500 text-xs mt-0.5 truncate">{lesson.content}</p>
                      )}
                    </div>
                    {enrollment && (
                      <Link
                        to={`/courses/${id}/lessons/${lesson._id}`}
                        className="text-xs text-sky-400 hover:text-sky-300 font-medium shrink-0 transition-colors"
                      >
                        {isCompleted ? 'Review' : 'Start'} →
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
