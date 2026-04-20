import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageLoader } from './components/ui/Spinner';
import { Landing, Login, Signup, ForgotPassword, Dashboard, Settings } from './pages';
import Chantiers from './pages/Chantiers';
import Equipes from './pages/Equipes';
import Pilotage from './pages/Pilotage';
import Planning from './pages/Planning';

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/chantiers" element={<ProtectedRoute><Chantiers /></ProtectedRoute>} />
      <Route path="/equipes" element={<ProtectedRoute><Equipes /></ProtectedRoute>} />
      <Route path="/pilotage" element={<ProtectedRoute><Pilotage /></ProtectedRoute>} />
      <Route path="/planning" element={<ProtectedRoute><Planning /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
