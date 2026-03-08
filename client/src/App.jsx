import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LaboursPage from './pages/LaboursPage.jsx';
import AddLabourPage from './pages/AddLabourPage.jsx';
import LabourProfilePage from './pages/LabourProfilePage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { ADMIN_ROLES } from './utils/constants.js';
import { useAuth } from './hooks/useAuth.js';

function HomeRedirect() {
  const { admin } = useAuth();
  const target = admin?.role === ADMIN_ROLES.LABOUR ? '/my-profile' : '/dashboard';
  return <Navigate to={target} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute roles={[ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN, ADMIN_ROLES.MANAGER, ADMIN_ROLES.LABOUR]}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute roles={[ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN, ADMIN_ROLES.MANAGER]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="labours"
          element={
            <ProtectedRoute roles={[ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN, ADMIN_ROLES.MANAGER]}>
              <LaboursPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="labours/add"
          element={
            <ProtectedRoute roles={[ADMIN_ROLES.SUPER_ADMIN]}>
              <AddLabourPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-profile"
          element={
            <ProtectedRoute roles={[ADMIN_ROLES.LABOUR]}>
              <LabourProfilePage selfMode />
            </ProtectedRoute>
          }
        />
        <Route
          path="labour/:id"
          element={
            <ProtectedRoute roles={[ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN, ADMIN_ROLES.MANAGER]}>
              <LabourProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute roles={[ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN, ADMIN_ROLES.MANAGER]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
