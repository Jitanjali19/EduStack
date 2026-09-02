import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import EduStackLogo from '../components/EduStackLogo';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    setMessage('');
    setResetUrl('');
    setError('');
    try {
      const { data } = await apiClient.post('/auth/forgot-password', { email });
      setMessage(data.message);
      setResetUrl(data.resetUrl);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send reset instructions.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center"><EduStackLogo /><h1 className="text-3xl font-bold text-white">Forgot password?</h1><p className="mt-2 text-slate-400">Enter your account email to receive a reset link.</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-xl">
          {(message || error) && <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'}`}><p>{error || message}</p>{resetUrl && <Link to={resetUrl.replace(window.location.origin, '')} className="mt-3 block break-all text-sky-300 underline">Open reset link</Link>}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label className="mb-1.5 block text-sm font-medium text-slate-300">Email address</label><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white focus:border-sky-500 focus:outline-none" /></div>
            <button type="submit" disabled={sending} className="w-full rounded-lg bg-sky-600 py-3 text-sm font-semibold text-white disabled:opacity-50">{sending ? 'Sending...' : 'Send reset link'}</button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500"><Link to="/login" className="font-medium text-sky-400 hover:text-sky-300">Back to sign in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;