import { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';

const emptyForm = { name: '', email: '', password: '' };

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const usersResponse = await apiClient.get('/admin/users');
      setUsers(usersResponse.data.users || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load admin data.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createInstructor = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const { data } = await apiClient.post('/admin/instructors', form);
      setUsers((current) => [data.instructor, ...current]);
      setForm(emptyForm);
      setMessage('Instructor created. They can now sign in from the login page.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to create instructor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">Platform Control</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Admin Console</h1>
          <p className="mt-1 text-sm text-slate-400">Create instructors and manage platform users.</p>
        </header>

        {(message || error) && (
          <p className={`rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'}`}>
            {error || message}
          </p>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Create Instructor</h2>
          <form onSubmit={createInstructor} className="mt-4 grid gap-3 sm:grid-cols-4">
            <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white" />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white" />
            <input required minLength="8" type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white" />
            <button disabled={saving} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Creating...' : 'Create Instructor'}</button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Manage Users ({users.length})</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => <div key={user._id} className="rounded-lg border border-slate-800 bg-slate-950 p-3"><p className="font-medium text-white">{user.name}</p><p className="text-xs text-slate-400">{user.email}</p><p className="mt-1 text-xs uppercase text-sky-400">{user.role}</p></div>)}
          </div>
        </section>

      </div>
    </main>
  );
};

export default AdminPage;
