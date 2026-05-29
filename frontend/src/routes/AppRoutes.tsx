import { Routes, Route } from "react-router-dom";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";


import LandingPage from "../pages/public/LandingPage";
import ConnectivityTestPage from "../pages/public/ConnectivityTestPage";
import AboutPage from "../pages/public/AboutPage";
import TermsOfUsePage from "../pages/public/TermsOfUsePage";
import PrivacyPolicyPage from "../pages/public/PrivacyPolicyPage";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

import MeritSheetPage from "../pages/student/MeritSheetPage";
import Dashboard from "../pages/student/DashboardPage";
import ProfilePage from "../pages/student/ProfilePage";
import StatsPage from "../pages/student/StatsPage";

import AdminDashboard from "../pages/admin/DashboardPage";
import UsersManagement from "../pages/admin/UsersPage";
import EventsManagement from "../pages/admin/EventsPage";
import HousesManagement from "../pages/admin/HousesPage";
import AttendanceReports from "../pages/admin/AttendanceReportsPage";
import PointsManagement from "../pages/admin/PointsPage";
import SystemSettings from "../pages/admin/SettingsPage";
import AuditLogs from "../pages/admin/AuditLogsPage";

import PublicLayout from "../components/layouts/PublicLayout";
import UserLayout from "../components/layouts/UserLayout";
import AdminLayout from "../components/layouts/AdminLayout";


export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/connectivity" element={<ConnectivityTestPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfUsePage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute roles={["STUDENT",]}>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/merit" element={<MeritSheetPage />} />
        <Route path="/stats" element={<StatsPage/>} />
      </Route>

      <Route
        path="/login" element={
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
