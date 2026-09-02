import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RegisterPage from './pages/RegisterPage';
import CourseCatalogPage from './pages/CourseCatalogPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CourseStudioPage from './pages/CourseStudioPage';
import LessonManagerPage from './pages/LessonManagerPage';
import MyCoursesPage from './pages/MyCoursesPage';
import LessonViewerPage from './pages/LessonViewerPage';
import InstructorDashboardPage from './pages/InstructorDashboardPage';
import AlertsPage from './pages/AlertsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : user?.role === 'instructor' ? '/dashboard' : '/courses'} replace />;
  }
  return children;
};

const RootRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'admin' ? '/admin' : user?.role === 'instructor' ? '/dashboard' : '/courses'} replace />;
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
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
        <Route path="/reset-password/:token" element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

        <Route path="/" element={<RootRedirect />} />

        <Route path="/courses" element={<ProtectedRoute><CourseCatalogPage /></ProtectedRoute>} />
        <Route path="/courses/:id" element={<ProtectedRoute><CourseDetailPage /></ProtectedRoute>} />
        <Route path="/courses/:courseId/lessons/:lessonId" element={<ProtectedRoute role="learner"><LessonViewerPage /></ProtectedRoute>} />
        <Route path="/my-courses" element={<ProtectedRoute role="learner"><MyCoursesPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute role="instructor"><InstructorDashboardPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>} />
        <Route path="/instructor/courses" element={<ProtectedRoute role="instructor"><CourseStudioPage /></ProtectedRoute>} />
        <Route path="/instructor/my-courses" element={<ProtectedRoute role="instructor"><CourseStudioPage ownOnly /></ProtectedRoute>} />
        <Route path="/instructor/courses/:id" element={<ProtectedRoute role="instructor"><LessonManagerPage /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute role="instructor"><AlertsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};


export default App;
