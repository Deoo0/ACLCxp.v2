import { Routes, Route } from "react-router-dom";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";

import MeritSheetPage from "../pages/student/MeritSheetPage";
import LandingPage from "../pages/public/LandingPage";
import ConnectivityTestPage from "../pages/public/ConnectivityTestPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import AboutPage from "../pages/public/AboutPage";
import PrivacyPolicyPage from "../pages/public/PrivacyPolicyPage";
import TermsOfUsePage from "../pages/public/TermsOfUsePage";
import Dashboard from "../pages/student/DashboardPage";
import ProfilePage from "../pages/student/ProfilePage";
import AdminDashboard from "../pages/admin/DashboardPage";
import AdminLayout from "../components/layouts/AdminLayout";
import UsersManagement from "../pages/admin/UsersPage";
import EventsManagement from "../pages/admin/EventsPage";
import HousesManagement from "../pages/admin/HousesPage";
import AttendanceReports from "../pages/admin/AttendanceReportsPage";
import PointsManagement from "../pages/admin/PointsPage";
import SystemSettings from "../pages/admin/SettingsPage";
import AuditLogs from "../pages/admin/AuditLogsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/connectivity" element={<ConnectivityTestPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfUsePage />} />

      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } 
      />
      
      <Route
        path="/merit"
        element={
          <ProtectedRoute>
            <MeritSheetPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="events" element={<EventsManagement />} />
        <Route path="houses" element={<HousesManagement />} />
        <Route path="attendance" element={<AttendanceReports />} />
        <Route path="points" element={<PointsManagement />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>
    </Routes>
  );
}
