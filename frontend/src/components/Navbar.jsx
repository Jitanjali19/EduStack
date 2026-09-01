import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import EduStackLogo from './EduStackLogo';

const Navbar = () => {
  const { user, isAuthenticated, isInstructor, logout } = useAuth();
  const [alertCount, setAlertCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !isInstructor) return;
    apiClient.get('/alerts')
      .then(res => setAlertCount(res.data.count || 0))
      .catch(() => setAlertCount(0));
  }, [isAuthenticated, isInstructor]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" aria-label="EduStack home">
          <EduStackLogo />
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-5">
              <Link to="/courses" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                Catalog
              </Link>
              {isInstructor ? (
                <>
                  <Link to="/dashboard" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/instructor/courses" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                    Course Studio
                  </Link>
                  <Link to="/alerts" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                    Alerts
                    {alertCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {alertCount}
                      </span>
                    )}
                  </Link>
                </>
              ) : (
                <Link to="/my-courses" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                  My Courses
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-300 text-sm font-semibold hidden sm:block">{user?.name}</span>
              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded tracking-wider ${
                isInstructor
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              }`}>
                {user?.role}
              </span>
              <button
                onClick={handleLogout}
                className="text-slate-400 border border-slate-600 hover:border-red-400 hover:text-red-400 text-sm px-3 py-1.5 rounded-md transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
              Login
            </Link>
            <Link to="/register" className="bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
