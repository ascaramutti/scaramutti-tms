import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { V2_LOGIN_URL } from './services/session';
import { DashboardPage } from './pages/DashboardPage.tsx';
import CreateServicePage from './pages/services/CreateServicePage.tsx';
import PendingServicesPage from './pages/services/PendingServicesPage.tsx';
import PendingStartServicesPage from './pages/services/PendingStartServicePage.tsx';
import InProgressServicesPage from './pages/services/InProgressServicePage.tsx';
import { WeeklyTripsReportPage } from './pages/reports/WeeklyTripsReportPage.tsx';

// El login único vive en v2 (/cotizaciones/login, otra SPA en el mismo
// origin): la redirección es externa al router (full page load).
function RedirectToUnifiedLogin() {
  useEffect(() => {
    window.location.assign(V2_LOGIN_URL);
  }, []);

  return <div className="flex justify-center items-center h-screen">Redirigiendo al login…</div>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <RedirectToUnifiedLogin />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position='top-center' richColors />
        <Routes>
          {/* /login retirado: el login único vive en v2 (/cotizaciones/login) */}
          <Route path="/login" element={<RedirectToUnifiedLogin />} />
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
          <Route
            path="/services/in-progress"
            element={
              <ProtectedRoute>
                <InProgressServicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/weekly-trips"
            element={
              <ProtectedRoute>
                <WeeklyTripsReportPage />
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