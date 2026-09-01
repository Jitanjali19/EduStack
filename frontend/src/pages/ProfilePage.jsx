import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

const ProfilePage = () => {
  const { user, isInstructor } = useAuth();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/auth/me')
      .then(({ data }) => setProfile(data.user))
      .catch(() => setProfile(user))
      .finally(() => setLoading(false));
  }, [user]);

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString()
    : 'Available after account refresh';

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">Account</p>
            <h1 className="mt-2 text-3xl font-bold text-white">My Profile</h1>
            <p className="mt-1 text-sm text-slate-400">Your EduStack account details and access.</p>
          </div>
          <Link to={isInstructor ? '/dashboard' : '/courses'} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-sky-500 hover:text-sky-300">
            Back
          </Link>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <div className="flex flex-col gap-5 border-b border-slate-800 bg-slate-900/80 p-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-sky-400/30 bg-slate-800 text-3xl font-bold text-sky-300">
              {profile?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{profile?.name || 'EduStack user'}</h2>
              <p className="mt-1 text-sm text-slate-400">{profile?.email || 'Email unavailable'}</p>
              <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${isInstructor ? 'border-purple-500/40 bg-purple-500/15 text-purple-300' : 'border-sky-500/40 bg-sky-500/15 text-sky-300'}`}>
                {profile?.role || 'user'}
              </span>
            </div>
          </div>

          <div className="grid gap-px bg-slate-800 sm:grid-cols-2">
            <div className="bg-slate-900 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full name</p>
              <p className="mt-2 text-base font-medium text-slate-100">{profile?.name || 'Not available'}</p>
            </div>
            <div className="bg-slate-900 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email address</p>
              <p className="mt-2 break-all text-base font-medium text-slate-100">{profile?.email || 'Not available'}</p>
            </div>
            <div className="bg-slate-900 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account type</p>
              <p className="mt-2 text-base font-medium capitalize text-slate-100">{profile?.role || 'Not available'}</p>
            </div>
            <div className="bg-slate-900 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Member since</p>
              <p className="mt-2 text-base font-medium text-slate-100">{loading ? 'Loading...' : joinedDate}</p>
            </div>
          </div>

          <div className="border-t border-slate-800 p-6">
            <h3 className="text-base font-semibold text-white">What you can do</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {isInstructor
                ? 'Create and manage courses, add lessons, enroll learners, and review progress and inactivity alerts.'
                : 'Browse published courses, enroll at your own pace, and track your lesson progress.'}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProfilePage;
