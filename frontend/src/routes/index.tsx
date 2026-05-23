import { Routes, Route } from "react-router-dom";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";

import MeritSheetPage from "../pages/MeritSheetPage";
import LandingPage from "../pages/LandingPage";
import ConnectivityTestPage from "../pages/ConnectivityTestPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import AboutPage from "../pages/AboutPage";
import PrivacyPolicyPage from "../pages/PrivacyPolicyPage";
import TermsOfUsePage from "../pages/TermsOfUsePage";
import Dashboard from "../pages/DashboardPage";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminLayout from "../pages/admin/AdminLayout";
import UsersManagement from "../pages/admin/UsersManagement";
import EventsManagement from "../pages/admin/EventsManagement";
import HousesManagement from "../pages/admin/HousesManagement";
import AttendanceReports from "../pages/admin/AttendanceReports";
import PointsManagement from "../pages/admin/PointsManagement";
import SystemSettings from "../pages/admin/SystemSettings";
import AuditLogs from "../pages/admin/AuditLogs";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/connectivity" element={<ConnectivityTestPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfUsePage />} />
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
