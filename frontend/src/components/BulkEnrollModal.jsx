import { useState, useRef } from 'react';
import apiClient from '../api/apiClient';

const BulkEnrollModal = ({ courseId, courseTitle, onClose, onComplete }) => {
  const [inputMode, setInputMode] = useState('paste'); // 'paste' | 'upload'
  const [emailsText, setEmailsText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedEmails, setParsedEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingCsv, setExportingCsv] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  // Extract email addresses from raw text or CSV strings
  const extractEmails = (text) => {
    if (!text) return [];
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];
    return matches.map((e) => e.trim().toLowerCase());
  };

  // Handle file parsing (.csv or .txt)
  const processFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('Please upload a valid .csv or .txt file containing email addresses.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result || '';
      const extracted = extractEmails(content);
      if (extracted.length === 0) {
        setError('No valid email addresses found in the uploaded file.');
        setUploadedFile(null);
        setParsedEmails([]);
      } else {
        setUploadedFile({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          count: extracted.length,
        });
        setParsedEmails(extracted);
      }
    };
    reader.onerror = () => {
      setError('Failed to read uploaded file.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Sample emails helper to assist users and instructors
  const handleInsertSampleEmails = () => {
    const sample = 'learner@example.com\nlearner2@example.com\nunregistered.user@company.com';
    setEmailsText(sample);
  };

  // Compute active list of emails to submit
  const getActiveEmailList = () => {
    if (inputMode === 'upload') {
      return parsedEmails;
    }
    return extractEmails(emailsText);
  };

  const detectedEmails = inputMode === 'upload' ? parsedEmails : extractEmails(emailsText);

  // Close modal and notify parent if any changes occurred
  const handleClose = () => {
    if (result && onComplete) {
      onComplete();
    }
    onClose();
  };

  // Submit bulk enrollment
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const emailsToEnroll = getActiveEmailList();

    if (emailsToEnroll.length === 0) {
      setError('Please enter or upload at least one valid email address.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const { data } = await apiClient.post(`/enrollments/bulk-enroll/${courseId}`, {
        emails: emailsToEnroll,
      });
      setResult(data);
      // Do NOT trigger onComplete here so modal remains open in results view!
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process bulk enrollment.');
    } finally {
      setLoading(false);
    }
  };

  // Download Progress CSV directly
  const handleDownloadProgressCsv = async () => {
    setExportingCsv(true);
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
      alert('Failed to export CSV progress report.');
    } finally {
      setExportingCsv(false);
    }
  };

  // Reset to enroll another batch
  const handleReset = () => {
    setResult(null);
    setEmailsText('');
    setUploadedFile(null);
    setParsedEmails([]);
    setError('');
  };

  // Filter and search results
  const filteredResults = (result?.results || []).filter((item) => {
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = item.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">👥</span>
              <h2 className="text-white font-bold text-lg">Bulk Enroll Learners</h2>
            </div>
            <p className="text-slate-400 text-xs mt-0.5 truncate max-w-md">
              Course: <span className="text-sky-300 font-semibold">{courseTitle}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            <div className="space-y-5">
              {/* Input Mode Selector Tabs */}
              <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    inputMode === 'paste'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>📋</span> Paste Email List
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    inputMode === 'upload'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>📁</span> Upload CSV / Text File
                </button>
              </div>

              {/* MODE 1: Paste Input */}
              {inputMode === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-300">
                      Learner Email Addresses (separated by newline, comma, or space)
                    </label>
                    <button
                      type="button"
                      onClick={handleInsertSampleEmails}
                      className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline"
                    >
                      + Insert Sample Emails
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={emailsText}
                    onChange={(e) => setEmailsText(e.target.value)}
                    placeholder="Enter or paste learner email addresses here (e.g. learner@example.com, learner2@example.com)..."
                    className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono transition-colors resize-none"
                  />

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {detectedEmails.length > 0 ? (
                        <span className="text-emerald-400 font-semibold">
                          ✓ {detectedEmails.length} valid email address{detectedEmails.length === 1 ? '' : 'es'} detected
                        </span>
                      ) : (
                        'Enter one or more email addresses above.'
                      )}
                    </span>
                    {emailsText && (
                      <button
                        type="button"
                        onClick={() => setEmailsText('')}
                        className="text-slate-500 hover:text-slate-300 text-[11px]"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* MODE 2: File Upload Input */}
              {inputMode === 'upload' && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      dragActive
                        ? 'border-sky-500 bg-sky-500/10'
                        : uploadedFile
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-slate-700 hover:border-slate-500 bg-slate-950/40 hover:bg-slate-950/70'
                    }`}
                  >
                    {!uploadedFile ? (
                      <div className="space-y-2">
                        <div className="text-3xl">📥</div>
                        <p className="text-sm font-semibold text-slate-200">
                          Drop your CSV or TXT file here, or <span className="text-sky-400">browse</span>
                        </p>
                        <p className="text-xs text-slate-500">
                          Supports CSV with email columns or plain text files containing one email per line.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-3xl">📄</div>
                        <p className="text-sm font-bold text-emerald-400">{uploadedFile.name}</p>
                        <p className="text-xs text-slate-300 font-mono">
                          {uploadedFile.size} • {uploadedFile.count} email{uploadedFile.count === 1 ? '' : 's'} extracted
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedFile(null);
                            setParsedEmails([]);
                          }}
                          className="text-xs text-red-400 hover:text-red-300 underline mt-2"
                        >
                          Remove file
                        </button>
                      </div>
                    )}
                  </div>

                  {parsedEmails.length > 0 && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 max-h-32 overflow-y-auto">
                      <p className="text-[11px] font-semibold text-slate-400 mb-1">
                        Preview ({parsedEmails.length} emails):
                      </p>
                      <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                        {parsedEmails.slice(0, 8).map((email, idx) => (
                          <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                            {email}
                          </span>
                        ))}
                        {parsedEmails.length > 8 && (
                          <span className="text-slate-500 text-[11px] self-center">
                            +{parsedEmails.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="flex gap-3 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || detectedEmails.length === 0}
                  className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin text-sm">⏳</span>
                      <span>Enrolling Learners...</span>
                    </>
                  ) : (
                    <span>Start Bulk Enrollment ({detectedEmails.length})</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Results View */
            <div className="space-y-5">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-4 gap-2.5">
                <div
                  onClick={() => setFilterStatus('all')}
                  className={`border rounded-xl p-3 text-center cursor-pointer transition-all ${
                    filterStatus === 'all'
                      ? 'bg-slate-800 border-sky-500/60 ring-1 ring-sky-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50'
                  }`}
                >
                  <p className="text-lg font-bold text-white font-mono">{result.summary.total}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Total</p>
                </div>
                <div
                  onClick={() => setFilterStatus('enrolled')}
                  className={`border rounded-xl p-3 text-center cursor-pointer transition-all ${
                    filterStatus === 'enrolled'
                      ? 'bg-emerald-500/20 border-emerald-500/80 ring-1 ring-emerald-500/50'
                      : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15'
                  }`}
                >
                  <p className="text-lg font-bold text-emerald-400 font-mono">{result.summary.enrolled}</p>
                  <p className="text-[10px] text-emerald-300 uppercase font-semibold mt-0.5">Enrolled</p>
                </div>
                <div
                  onClick={() => setFilterStatus('already_enrolled')}
                  className={`border rounded-xl p-3 text-center cursor-pointer transition-all ${
                    filterStatus === 'already_enrolled'
                      ? 'bg-amber-500/20 border-amber-500/80 ring-1 ring-amber-500/50'
                      : 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15'
                  }`}
                >
                  <p className="text-lg font-bold text-amber-400 font-mono">{result.summary.already_enrolled}</p>
                  <p className="text-[10px] text-amber-300 uppercase font-semibold mt-0.5">Already Enrolled</p>
                </div>
                <div
                  onClick={() => setFilterStatus('unknown')}
                  className={`border rounded-xl p-3 text-center cursor-pointer transition-all ${
                    filterStatus === 'unknown'
                      ? 'bg-rose-500/20 border-rose-500/80 ring-1 ring-rose-500/50'
                      : 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/15'
                  }`}
                >
                  <p className="text-lg font-bold text-rose-400 font-mono">{result.summary.unknown}</p>
                  <p className="text-[10px] text-rose-300 uppercase font-semibold mt-0.5">Unknown</p>
                </div>
              </div>

              {/* Search Bar & Result Count */}
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Filter by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white placeholder-slate-500 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500 flex-1"
                />
                <span className="text-slate-400 text-xs font-mono shrink-0">
                  Showing {filteredResults.length} of {result.results.length}
                </span>
              </div>

              {/* Per-Email Results List */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60">
                  {filteredResults.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-500">
                      No results matching current filters.
                    </div>
                  ) : (
                    filteredResults.map((item, idx) => (
                      <div key={idx} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-850 transition-colors">
                        <span className="text-slate-200 font-mono">{item.email}</span>
                        <span
                          className={`font-semibold uppercase text-[10px] px-2.5 py-0.5 rounded-full border ${
                            item.status === 'enrolled'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : item.status === 'already_enrolled'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {item.status === 'enrolled'
                            ? 'Newly Enrolled'
                            : item.status === 'already_enrolled'
                            ? 'Already Enrolled'
                            : 'Unknown Address'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Export CSV & Finished Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleDownloadProgressCsv}
                  disabled={exportingCsv}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 font-semibold py-2.5 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span>📥</span>
                  <span>{exportingCsv ? 'Generating CSV...' : 'Export Course Learner Progress as CSV'}</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium py-2 rounded-xl text-xs transition-colors"
                  >
                    + Enroll More
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 rounded-xl text-xs transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkEnrollModal;

