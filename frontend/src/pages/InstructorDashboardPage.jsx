import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import BulkEnrollModal from '../components/BulkEnrollModal';

const InstructorDashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bulkCourse, setBulkCourse] = useState(null); // { id, title }
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchMetrics = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/dashboard');
      setMetrics(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics(true);
  }, [fetchMetrics]);

  // CSV Export Handler
  const handleExportCsv = async (courseId, courseTitle) => {
    setDownloadingId(courseId);
    try {
      const response = await apiClient.get(`/enrollments/course/${courseId}/export-csv`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${courseTitle.replace(/\s+/g, '_')}_progress_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Failed to export CSV report.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse text-sm">Loading intelligence dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchMetrics}
            className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { headline, breakdownByCourse = [], eightWeekCompletionTrend = [] } = metrics || {};

  // Maximum value for weekly chart normalization
  const maxWeeklyCount = Math.max(...eightWeekCompletionTrend.map((w) => w.completionsCount), 1);

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white">Instructor Intelligence Hub</h1>
            <p className="text-slate-400 text-sm mt-1">
              Headline metrics, completion trends, and course performance analytics.
            </p>
          </div>
          <button
            onClick={fetchMetrics}
            className="text-xs border border-slate-700 hover:border-slate-500 text-slate-300 px-3.5 py-2 rounded-xl transition-colors"
          >
            ↻ Refresh Metrics
          </button>
        </div>

        {/* 1. Headline Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Learners</p>
            <p className="text-3xl font-bold text-white mt-2 font-mono">{headline?.totalLearners ?? 0}</p>
            <p className="text-[11px] text-slate-500 mt-1">Registered platform accounts</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Published Courses</p>
            <p className="text-3xl font-bold text-sky-400 mt-2 font-mono">{headline?.publishedCourses ?? 0}</p>
            <p className="text-[11px] text-slate-500 mt-1">Active in catalog</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Learners In Progress</p>
            <p className="text-3xl font-bold text-amber-400 mt-2 font-mono">{headline?.learnersInProgress ?? 0}</p>
            <p className="text-[11px] text-slate-500 mt-1">Actively working on courses</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completions This Month</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2 font-mono">{headline?.completionsThisMonth ?? 0}</p>
            <p className="text-[11px] text-slate-500 mt-1">Finished since 1st of month</p>
          </div>
        </div>

        {/* 2. 8-Week Completion Trend Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-bold text-base">8-Week Completion Trend</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Number of completed course enrollments per week over the last 8 weeks.
              </p>
            </div>
          </div>

          {/* Bar Graph Visual */}
          <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-800">
            {eightWeekCompletionTrend.map((week) => {
              const heightPercent = Math.max((week.completionsCount / maxWeeklyCount) * 100, 6);
              return (
                <div key={week.weekLabel} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip Count */}
                  <span className="text-[11px] font-mono text-slate-400 group-hover:text-emerald-400 font-bold transition-colors">
                    {week.completionsCount}
                  </span>

                  {/* Bar */}
                  <div
                    className="w-full max-w-12 bg-slate-800 group-hover:bg-emerald-500 rounded-t-lg transition-all duration-300 relative overflow-hidden"
                    style={{ height: `${heightPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>

                  {/* Label */}
                  <span className="text-[10px] sm:text-xs text-slate-500 group-hover:text-slate-300 truncate">
                    {week.weekLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Course Progress Breakdown Table with CSV Export & Bulk Enroll */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-white font-bold text-base">Course Progress Breakdown</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Detailed enrollment states, bulk enrollment, and downloadable CSV audit sheets.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Course Title</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center">Total Enrolled</th>
                  <th className="px-4 py-3.5 text-center">Not Started</th>
                  <th className="px-4 py-3.5 text-center">In Progress</th>
                  <th className="px-4 py-3.5 text-center">Completed</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {breakdownByCourse.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                      No course performance data available yet.
                    </td>
                  </tr>
                ) : (
                  breakdownByCourse.map((c) => (
                    <tr key={c.courseId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-white max-w-xs truncate">
                        {c.title}
                      </td>
                      <td className="px-4 py-4 text-slate-400">{c.category}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            c.status === 'published'
                              ? 'bg-green-500/15 text-green-400 border-green-500/30'
                              : c.status === 'draft'
                              ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                              : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-mono font-bold text-slate-200">
                        {c.totalEnrollments}
                      </td>
                      <td className="px-4 py-4 text-center font-mono text-slate-400">{c.notStarted}</td>
                      <td className="px-4 py-4 text-center font-mono text-amber-400 font-semibold">
                        {c.inProgress}
                      </td>
                      <td className="px-4 py-4 text-center font-mono text-emerald-400 font-semibold">
                        {c.completed}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Bulk Enroll Button */}
                          <button
                            onClick={() => setBulkCourse({ id: c.courseId, title: c.title })}
                            disabled={c.status !== 'published'}
                            title={c.status !== 'published' ? 'Only published courses allow enrollment' : 'Bulk enroll learners'}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-sky-500 text-slate-300 hover:text-sky-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[11px] font-medium"
                          >
                            + Bulk Enroll
                          </button>

                          {/* Download CSV Button */}
                          <button
                            onClick={() => handleExportCsv(c.courseId, c.title)}
                            disabled={downloadingId === c.courseId}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 disabled:opacity-40 transition-colors text-[11px] font-medium"
                          >
                            {downloadingId === c.courseId ? 'Exporting...' : '📥 CSV'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Bulk Enroll Modal */}
      {bulkCourse && (
        <BulkEnrollModal
          courseId={bulkCourse.id}
          courseTitle={bulkCourse.title}
          onClose={() => setBulkCourse(null)}
          onComplete={fetchMetrics}
        />
      )}
    </div>
  );
};

export default InstructorDashboardPage;
