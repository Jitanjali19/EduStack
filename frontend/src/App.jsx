import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'instructor' ? '/dashboard' : '/courses'} replace />;
  }
  return children;
};

const RootRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'instructor' ? '/dashboard' : '/courses'} replace />;
};

const Placeholder = ({ title }) => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
      <p className="text-slate-400 text-sm">Coming soon...</p>
    </div>
  </div>
);

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950">
      {isAuthenticated && <Navbar />}
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

        <Route path="/" element={<RootRedirect />} />

        <Route path="/courses" element={<ProtectedRoute><Placeholder title="Course Catalog" /></ProtectedRoute>} />
        <Route path="/my-courses" element={<ProtectedRoute role="learner"><Placeholder title="My Courses" /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute role="instructor"><Placeholder title="Dashboard" /></ProtectedRoute>} />
        <Route path="/instructor/courses" element={<ProtectedRoute role="instructor"><Placeholder title="Course Studio" /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute role="instructor"><Placeholder title="Alerts" /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};

export default App;
