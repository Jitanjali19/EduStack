import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

const STATUS_TABS = [
  { key: 'all', label: 'All Courses' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'not_started', label: 'Not Started' },
];

const STATUS_BADGES = {
  not_started: {
    label: 'Not Started',
    style: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  },
  in_progress: {
    label: 'In Progress',
    style: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  completed: {
    label: 'Completed',
    style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
};

const MyCoursesPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchMyCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (status !== 'all') params.status = status;
      if (debouncedSearch) params.search = debouncedSearch;

      const { data } = await apiClient.get('/enrollments/my-courses', { params });
      setEnrollments(data.enrollments || []);
      setPagination(data.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch {
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => {
    fetchMyCourses();
  }, [fetchMyCourses]);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Enrolled Courses</h1>
            <p className="text-slate-400 text-sm mt-1">
              Track your progress and continue learning where you left off.
            </p>
          </div>
          <Link
            to="/courses"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Browse Catalog →
          </Link>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleStatusChange(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  status === tab.key
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search my courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
          </div>
        </div>

        {/* Course Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-6 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-full" />
                <div className="h-2 bg-slate-800 rounded-full" />
              </div>
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-white font-semibold text-lg">No enrolled courses found</h3>
            <p className="text-slate-400 text-sm mt-1 mb-6">
              {status !== 'all' || debouncedSearch
                ? 'Try adjusting your filters or search term.'
                : 'Explore our catalog to discover and enroll in new courses.'}
            </p>
            <Link
              to="/courses"
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors inline-block"
            >
              Explore Course Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => {
              const course = enrollment.courseId;
              if (!course) return null;

              const badge = STATUS_BADGES[enrollment.status] || STATUS_BADGES.not_started;
              const completedCount = enrollment.completedLessons?.length || 0;
              const isCompleted = enrollment.status === 'completed';

              return (
                <div
                  key={enrollment._id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between transition-all duration-150"
                >
                  <div>
                    {/* Header: Category & Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-md">
                        {course.category || 'General'}
                      </span>
                      <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${badge.style}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-white font-bold text-lg leading-snug mb-2 line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-6">
                      {course.description}
                    </p>
                  </div>

                  <div>
                    {/* Progress Bar Info */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400 font-medium">Completed Lessons</span>
                        <span className="text-slate-200 font-semibold font-mono">
                          {completedCount} {completedCount === 1 ? 'lesson' : 'lessons'}
                        </span>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-sky-500'
                          }`}
                          style={{
                            width: isCompleted ? '100%' : `${Math.min(100, Math.max(10, completedCount * 25))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Meta and Action Link */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                      <span className="text-xs text-slate-500">
                        by {course.instructor?.name || 'Instructor'}
                      </span>
                      <Link
                        to={`/courses/${course._id}`}
                        className={`text-xs font-semibold px-4 py-2 rounded-xl transition-colors ${
                          isCompleted
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                        }`}
                      >
                        {isCompleted ? 'Review Course' : enrollment.status === 'in_progress' ? 'Continue →' : 'Start Course →'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-10 border-t border-slate-800 pt-6">
            <p className="text-xs text-slate-500">
              Showing page <span className="text-slate-300 font-semibold">{pagination.page}</span> of{' '}
              <span className="text-slate-300 font-semibold">{pagination.totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="px-3.5 py-1.5 text-xs font-medium border border-slate-800 text-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.totalPages}
                className="px-3.5 py-1.5 text-xs font-medium border border-slate-800 text-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCoursesPage;
