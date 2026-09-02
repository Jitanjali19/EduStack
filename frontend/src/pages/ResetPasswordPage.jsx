import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import EduStackLogo from '../components/EduStackLogo';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setSaving(true);
    try {
      await apiClient.post(`/auth/reset-password/${token}`, { password });
      navigate('/login', { state: { message: 'Password reset successful. Please sign in.' } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md"><div className="mb-8 flex flex-col items-center text-center"><EduStackLogo /><h1 className="text-3xl font-bold text-white">Set a new password</h1><p className="mt-2 text-slate-400">Choose a password with at least 8 characters.</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-xl">{error && <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5"><div><label className="mb-1.5 block text-sm font-medium text-slate-300">New password</label><input required minLength="8" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white focus:border-sky-500 focus:outline-none" /></div><div><label className="mb-1.5 block text-sm font-medium text-slate-300">Confirm password</label><input required minLength="8" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white focus:border-sky-500 focus:outline-none" /></div><button type="submit" disabled={saving} className="w-full rounded-lg bg-sky-600 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Reset password'}</button></form>
          <p className="mt-6 text-center text-sm text-slate-500"><Link to="/login" className="font-medium text-sky-400 hover:text-sky-300">Back to sign in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;