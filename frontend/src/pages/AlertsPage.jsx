import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dismissingId, setDismissingId] = useState(null);
  const [error, setError] = useState('');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/alerts');
      setAlerts(data.alerts || []);
      setCount(data.count || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch inactivity alerts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Dismiss Inactivity Alert
  const handleDismiss = async (enrollmentId) => {
    setDismissingId(enrollmentId);
    try {
      await apiClient.post(`/alerts/dismiss/${enrollmentId}`);
      setAlerts((prev) => prev.filter((a) => a.enrollmentId !== enrollmentId));
      setCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dismiss alert.');
    } finally {
      setDismissingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse text-sm">Loading learner inactivity alerts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchAlerts}
            className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">Learner Inactivity Alerts</h1>
              {count > 0 && (
                <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
                  {count} Active
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Learners with courses "In Progress" who have had no activity for over 14 days.
            </p>
          </div>
          <button
            onClick={fetchAlerts}
            className="text-xs border border-slate-700 hover:border-slate-500 text-slate-300 px-3.5 py-2 rounded-xl transition-colors"
          >
            ↻ Check for New Alerts
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="text-lg">ℹ️</span>
          <p>
            Dismissing an alert suppresses notification until the learner interacts again and subsequent inactivity exceeds 14 days.
          </p>
        </div>

        {/* Alerts Table / Cards */}
        {alerts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-white font-semibold text-lg">All Learners Active</h3>
            <p className="text-slate-400 text-sm mt-1">
              There are currently no stalled learners in your courses.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Learner</th>
                    <th className="px-4 py-3.5">Course</th>
                    <th className="px-4 py-3.5">Last Active</th>
                    <th className="px-4 py-3.5 text-center">Inactivity Duration</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {alerts.map((alertItem) => (
                    <tr key={alertItem.enrollmentId} className="hover:bg-slate-800/30 transition-colors">
                      {/* Learner Info */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{alertItem.learner?.name || 'Unknown Learner'}</p>
                        <p className="text-slate-400 font-mono text-[11px] mt-0.5">{alertItem.learner?.email}</p>
                      </td>

                      {/* Course */}
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-200">{alertItem.course?.title || 'Unknown Course'}</p>
                        <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded mt-1 inline-block">
                          {alertItem.course?.category || 'General'}
                        </span>
                      </td>

                      {/* Last Active Timestamp */}
                      <td className="px-4 py-4 text-slate-400 font-mono">
                        {alertItem.lastActivityAt ? new Date(alertItem.lastActivityAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Days Inactive Badge */}
                      <td className="px-4 py-4 text-center">
                        <span className="bg-red-500/15 text-red-400 border border-red-500/30 font-bold px-2.5 py-1 rounded-full font-mono text-[11px]">
                          ⚠️ {alertItem.daysInactive} days inactive
                        </span>
                      </td>

                      {/* Dismiss Button */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDismiss(alertItem.enrollmentId)}
                          disabled={dismissingId === alertItem.enrollmentId}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-500 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          {dismissingId === alertItem.enrollmentId ? 'Dismissing...' : 'Dismiss'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AlertsPage;
