import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

const ACTION_CONFIG = {
  create: {
    label: 'Course Created',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    icon: '✨',
  },
  edit: {
    label: 'Course Edited',
    badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    icon: '✏️',
  },
  publish: {
    label: 'Published',
    badge: 'bg-green-500/15 text-green-400 border-green-500/30',
    icon: '🚀',
  },
  archive: {
    label: 'Archived',
    badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    icon: '📦',
  },
  restore: {
    label: 'Restored to Draft',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    icon: '🔄',
  },
  lesson_add: {
    label: 'Lesson Added',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: '➕',
  },
  lesson_edit: {
    label: 'Lesson Updated',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: '📝',
  },
  lesson_delete: {
    label: 'Lesson Deleted',
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    icon: '🗑️',
  },
  comment: {
    label: 'Audit Comment',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: '💬',
  },
};

const ActivityLogModal = ({ courseId, courseTitle, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get(`/courses/${courseId}/activity`);
      setLogs(data.activity || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activity history.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setPostingComment(true);
    try {
      const { data } = await apiClient.post(`/courses/${courseId}/comments`, {
        comment: commentText.trim(),
      });
      setLogs(prev => [data.logEntry, ...prev]);
      setCommentText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterAction === 'all') return true;
    if (filterAction === 'lifecycle') {
      return ['create', 'edit', 'publish', 'archive', 'restore'].includes(log.action);
    }
    if (filterAction === 'lessons') {
      return ['lesson_add', 'lesson_edit', 'lesson_delete'].includes(log.action);
    }
    if (filterAction === 'comments') {
      return log.action === 'comment';
    }
    return log.action === filterAction;
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-lg">Immutable Audit Log</h2>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                Append-Only
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5 truncate max-w-md">
              Course: <span className="text-slate-200 font-medium">{courseTitle || courseId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl leading-none p-1"
          >
            ×
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { key: 'all', label: `All (${logs.length})` },
              { key: 'lifecycle', label: 'Lifecycle' },
              { key: 'lessons', label: 'Lessons' },
              { key: 'comments', label: 'Comments' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterAction(f.key)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filterAction === f.key
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Timeline Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-800/40 rounded-xl p-4 animate-pulse space-y-2">
                  <div className="h-3 bg-slate-700 rounded w-1/4" />
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                  <div className="h-2 bg-slate-800 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-400 text-sm mb-3">{error}</p>
              <button
                onClick={fetchLogs}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No activity records match this filter.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-800 ml-3.5 space-y-6">
              {filteredLogs.map((log) => {
                const conf = ACTION_CONFIG[log.action] || {
                  label: log.action,
                  badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
                  icon: '📌',
                };
                return (
                  <div key={log._id} className="relative pl-6 group">
                    {/* Node Dot / Icon */}
                    <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-xs group-hover:border-sky-500 transition-colors shadow-sm">
                      {conf.icon}
                    </div>

                    {/* Content Card */}
                    <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 hover:border-slate-600 transition-colors">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${conf.badge}`}>
                          {conf.label}
                        </span>
                        <span className="text-slate-500 text-xs font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                        {log.details}
                      </p>

                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/40 text-xs text-slate-500">
                        <span>Actor:</span>
                        <span className="text-slate-300 font-medium">
                          {log.actorId?.name || 'System / Admin'}
                        </span>
                        {log.actorId?.email && (
                          <span className="text-slate-500">({log.actorId.email})</span>
                        )}
                        {log.actorId?.role && (
                          <span className="capitalize text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded border border-slate-700">
                            {log.actorId.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Append Audit Comment Form */}
        <form onSubmit={handlePostComment} className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add an immutable audit note or comment..."
              className="flex-1 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
            <button
              type="submit"
              disabled={postingComment || !commentText.trim()}
              className="bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-colors shrink-0"
            >
              {postingComment ? 'Adding...' : 'Post Note'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 px-1">
            ⚠️ Entries in this log are permanent and protected against mutation or deletion.
          </p>
        </form>

      </div>
    </div>
  );
};

export default ActivityLogModal;
