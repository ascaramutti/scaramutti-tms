import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage.tsx';
import CreateServicePage from './pages/services/CreateServicePage.tsx';
import PendingServicesPage from './pages/services/PendingServicesPage.tsx';
import PendingStartServicesPage from './pages/services/PendingStartServicePage.tsx';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position='top-center' richColors />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-service"
            element={
              <ProtectedRoute>
                <CreateServicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/pending"
            element={
              <ProtectedRoute>
                <PendingServicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/pending-start"
            element={
              <ProtectedRoute>
                <PendingStartServicesPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;