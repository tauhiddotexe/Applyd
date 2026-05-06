import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppShell from './components/AppShell';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import Analytics from './pages/Analytics';
import AddEdit from './pages/AddEdit';
import Details from './pages/Details';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import Autofill from './pages/Autofill';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span></div>;
  // For demo, allow access without auth
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* Protected with shell */}
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/applications/new" element={<AddEdit />} />
            <Route path="/applications/:id" element={<Details />} />
            <Route path="/applications/:id/edit" element={<AddEdit />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/resume" element={<ResumeAnalyzer />} />
            <Route path="/autofill" element={<Autofill />} />
          </Route>
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
