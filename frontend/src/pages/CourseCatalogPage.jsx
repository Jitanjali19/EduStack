import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Web Development', 'Compliance', 'Design', 'Data Science', 'Marketing', 'Leadership'];
const STATUSES = ['all', 'draft', 'published', 'archived'];
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Creation Date' },
  { value: 'title', label: 'Title' },
  { value: 'enrollmentCount', label: 'Enrollment Count' },
];

const StatusBadge = ({ status }) => {
  const styles = {
    published: 'bg-green-500/15 text-green-400 border border-green-500/30',
    draft: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    archived: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  };
  return (
    <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
};

const CourseCard = ({ course, isInstructor }) => (
  <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 hover:border-slate-500 transition-colors flex flex-col gap-3">
    <div className="flex items-start justify-between gap-2">
      <h3 className="text-white font-semibold text-base leading-snug">{course.title}</h3>
      <StatusBadge status={course.status} />
    </div>
    <p className="text-slate-400 text-sm line-clamp-2">{course.description}</p>
    <div className="flex items-center gap-3 text-xs text-slate-500 mt-auto">
      <span className="bg-slate-800 px-2 py-0.5 rounded">{course.category}</span>
      <span>{course.enrollmentCount ?? 0} enrolled</span>
      <span>by {course.instructor?.name || 'Instructor'}</span>
    </div>
    <div className="flex gap-2 mt-1">
      <Link
        to={`/courses/${course._id}`}
        className="flex-1 text-center text-sm font-medium bg-sky-600 hover:bg-sky-500 text-white py-2 rounded-lg transition-colors"
      >
        View Course
      </Link>
      {isInstructor && (
        <Link
          to={`/instructor/courses/${course._id}`}
          className="text-sm font-medium border border-slate-600 hover:border-slate-400 text-slate-300 px-3 py-2 rounded-lg transition-colors"
        >
          Edit
        </Link>
      )}
    </div>
  </div>
);

const CourseCatalogPage = () => {
  const { isInstructor } = useAuth();

  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9, sortBy, order };
      if (debouncedSearch) params.search = debouncedSearch;
      if (category !== 'All') params.category = category;
      if (isInstructor && status !== 'all') params.status = status;

      const { data } = await apiClient.get('/courses', { params });
      setCourses(data.courses || []);
      setPagination(data.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, order, debouncedSearch, category, status, isInstructor]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleFilterChange = (setter) => (val) => { setter(val); setPage(1); };

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Course Catalog</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {pagination.total} course{pagination.total !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-48 bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
          />

          <select
            value={category}
            onChange={(e) => handleFilterChange(setCategory)(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {isInstructor && (
            <select
              value={status}
              onChange={(e) => handleFilterChange(setStatus)(e.target.value)}
              className="bg-slate-800 border border-slate-600 text-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 cursor-pointer capitalize"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>
              ))}
            </select>
          )}

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => handleFilterChange(setSortBy)(e.target.value)}
              className="bg-slate-800 border border-slate-600 text-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              onClick={() => handleFilterChange(setOrder)(order === 'asc' ? 'desc' : 'asc')}
              className="bg-slate-800 border border-slate-600 text-slate-300 rounded-lg px-3 py-2.5 text-sm hover:border-slate-400 transition-colors"
              title="Toggle order"
            >
              {order === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-800 rounded w-full mb-2" />
                <div className="h-3 bg-slate-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">No courses found.</p>
            <p className="text-slate-600 text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map(course => (
              <CourseCard key={course._id} course={course} isInstructor={isInstructor} />
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 border-t border-slate-800 pt-6">
            <p className="text-sm text-slate-500">
              Page <span className="text-slate-300 font-medium">{pagination.page}</span> of{' '}
              <span className="text-slate-300 font-medium">{pagination.totalPages}</span>
              <span className="ml-2 text-slate-600">({pagination.total} total)</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page <= 1}
                className="px-4 py-2 text-sm font-medium border border-slate-700 text-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-500 transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= pagination.totalPages}
                className="px-4 py-2 text-sm font-medium border border-slate-700 text-slate-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-500 transition-colors"
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

export default CourseCatalogPage;
