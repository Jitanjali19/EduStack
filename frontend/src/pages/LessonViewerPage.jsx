import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const LessonViewerPage = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Fetch course, lessons, and enrollment details
  const fetchLessonData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [lessonsRes, enrollRes] = await Promise.all([
        apiClient.get(`/lessons/course/${courseId}`),
        apiClient.get(`/enrollments/course/${courseId}`),
      ]);

      const fetchedLessons = lessonsRes.data.lessons || [];
      setCourse(lessonsRes.data.course);
      setLessons(fetchedLessons);
      setEnrollment(enrollRes.data.enrollment);
      setProgress(enrollRes.data.progress);

      // Select active lesson
      const active = fetchedLessons.find((l) => l._id === lessonId) || fetchedLessons[0];
      setCurrentLesson(active);

      // If active lesson doesn't match URL id, replace URL
      if (active && active._id !== lessonId) {
        navigate(`/courses/${courseId}/lessons/${active._id}`, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load lesson content.');
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId, navigate]);

  useEffect(() => {
    fetchLessonData();
  }, [fetchLessonData]);

  // Mark Lesson as Complete
  const handleMarkComplete = async () => {
    if (!currentLesson) return;
    setMarking(true);
    try {
      const { data } = await apiClient.patch(
        `/enrollments/course/${courseId}/lesson/${currentLesson._id}/complete`
      );
      setEnrollment(data.enrollment);
      setProgress(data.progress);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark lesson complete.');
    } finally {
      setMarking(false);
    }
  };

  const currentIndex = lessons.findIndex((l) => l._id === currentLesson?._id);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const isCompleted = enrollment?.completedLessons?.some(
    (id) => id.toString() === currentLesson?._id.toString()
  );

  const isAllCompleted = progress?.progressPercent === 100 || enrollment?.status === 'completed';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse text-sm">Loading lesson workspace...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <Link
            to={`/courses/${courseId}`}
            className="text-sky-400 hover:text-sky-300 text-sm font-medium"
          >
            ← Back to Course Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 shrink-0 flex items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
            title="Toggle Lesson Sidebar"
          >
            ☰
          </button>
          <div className="min-w-0">
            <Link
              to={`/courses/${courseId}`}
              className="text-slate-400 hover:text-slate-200 text-xs transition-colors truncate block"
            >
              ← {course?.title || 'Back to course'}
            </Link>
            <h1 className="text-white text-sm font-semibold truncate mt-0.5">
              {currentLesson?.title || 'Lesson'}
            </h1>
          </div>
        </div>

        {/* Course Progress Indicator */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-slate-300 font-medium font-mono">
              {progress?.completedLessonsCount || 0} / {progress?.totalLessons || lessons.length} Completed
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {progress?.progressPercent || 0}% Progress
            </span>
          </div>

          <div className="w-24 sm:w-32 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-300 ${
                isAllCompleted ? 'bg-emerald-500' : 'bg-sky-500'
              }`}
              style={{ width: `${progress?.progressPercent || 0}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Lesson Switcher Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'w-72 sm:w-80' : 'w-0 hidden'
          } bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-200 overflow-y-auto`}
        >
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Course Outline ({lessons.length})
            </h2>
          </div>

          <div className="p-2 space-y-1">
            {lessons.map((lesson, idx) => {
              const active = lesson._id === currentLesson?._id;
              const completed = enrollment?.completedLessons?.some(
                (id) => id.toString() === lesson._id.toString()
              );

              return (
                <button
                  key={lesson._id}
                  onClick={() => {
                    setCurrentLesson(lesson);
                    navigate(`/courses/${courseId}/lessons/${lesson._id}`);
                  }}
                  className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${
                    active
                      ? 'bg-sky-600/15 border border-sky-500/40 text-white'
                      : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      completed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : active
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {completed ? '✓' : idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${active ? 'text-sky-300 font-semibold' : ''}`}>
                      {lesson.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Lesson Content Pane */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col justify-between">
          <div className="max-w-3xl mx-auto w-full">
            {/* Completion Banner */}
            {isAllCompleted && (
              <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 text-emerald-400">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="text-sm font-bold">Congratulations! Course Completed</h3>
                  <p className="text-xs text-emerald-500/80 mt-0.5">
                    You have successfully completed all lessons in this course.
                  </p>
                </div>
              </div>
            )}

            {/* Lesson Title */}
            <div className="mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono uppercase bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-md border border-slate-700">
                  Lesson {currentIndex + 1} of {lessons.length}
                </span>
                {isCompleted && (
                  <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                    ✓ Completed
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {currentLesson?.title}
              </h2>
            </div>

            {/* Lesson Body Content */}
            <div className="prose prose-invert max-w-none text-slate-300 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-wrap">
              {currentLesson?.content}
            </div>
          </div>

          {/* Bottom Action / Navigation Toolbar */}
          <div className="max-w-3xl mx-auto w-full mt-12 pt-6 border-t border-slate-800 flex items-center justify-between gap-4 flex-wrap">
            {/* Prev Button */}
            {prevLesson ? (
              <button
                onClick={() => {
                  setCurrentLesson(prevLesson);
                  navigate(`/courses/${courseId}/lessons/${prevLesson._id}`);
                }}
                className="px-4 py-2 text-xs sm:text-sm font-medium border border-slate-700 hover:border-slate-500 text-slate-300 rounded-xl transition-colors"
              >
                ← Previous Lesson
              </button>
            ) : (
              <div />
            )}

            {/* Complete / Next Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleMarkComplete}
                disabled={marking || isCompleted}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {marking ? 'Saving...' : isCompleted ? '✓ Completed' : 'Mark Lesson Complete'}
              </button>

              {nextLesson && (
                <button
                  onClick={() => {
                    setCurrentLesson(nextLesson);
                    navigate(`/courses/${courseId}/lessons/${nextLesson._id}`);
                  }}
                  className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Next Lesson →
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LessonViewerPage;
