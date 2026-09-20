import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";

const LandingPage = lazy(() => import("../pages/public/LandingPage"));
const CompetitionResults = lazy(() => import("../components/landing/CompetitionResults"));
const ConnectivityTestPage = lazy(
  () => import("../pages/public/ConnectivityTestPage"),
);
const AboutPage = lazy(() => import("../pages/public/AboutPage"));
const TermsOfUsePage = lazy(() => import("../pages/public/TermsOfUsePage"));
const PrivacyPolicyPage = lazy(
  () => import("../pages/public/PrivacyPolicyPage"),
);

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));

const MeritSheetPage = lazy(() => import("../pages/student/MeritSheetPage"));
const Dashboard = lazy(() => import("../pages/student/DashboardPage"));
const ProfilePage = lazy(() => import("../pages/student/ProfilePage"));
const StatsPage = lazy(() => import("../pages/student/StatsPage"));
const EventsPage = lazy(() => import("../pages/student/EventsPage"));

const SeasonsPage = lazy(() => import("../pages/admin/SeasonsPage"));
const AdminDashboard = lazy(() => import("../pages/admin/DashboardPage"));
const MatchupsManagement = lazy(() => import("../pages/admin/MatchupsPage"));
const UsersManagement = lazy(() => import("../pages/admin/UsersPage"));
const EventsManagement = lazy(() => import("../pages/admin/EventsPage"));
const HousesManagement = lazy(() => import("../pages/admin/HousesPage"));
const AttendanceReports = lazy(
  () => import("../pages/admin/AttendanceReportsPage"),
);
const PointsManagement = lazy(() => import("../pages/admin/PointsPage"));
const SystemSettings = lazy(() => import("../pages/admin/SettingsPage"));
const AuditLogs = lazy(() => import("../pages/admin/AuditLogsPage"));

import PublicLayout from "../components/layouts/PublicLayout";
import UserLayout from "../components/layouts/UserLayout";
import AdminLayout from "../components/layouts/AdminLayout";
import PageTransition from "../components/feedback/PageTransition";

export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="flex min-h-[60vh] items-center justify-center bg-neutral-950 text-neutral-400"
        >
          Loading your workspace...
        </div>
      }
    >
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/results" element={<div className="min-h-screen bg-neutral-950 pt-24"><CompetitionResults /></div>} />
          <Route path="/connectivity" element={<ConnectivityTestPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfUsePage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute roles={["STUDENT"]}>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/merit" element={<MeritSheetPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/events" element={<EventsPage />} />
        </Route>

        <Route
          path="/login"
          element={
            <PublicRoute>
              <PageTransition>
                <LoginPage />
              </PageTransition>
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <PageTransition>
                <RegisterPage />
              </PageTransition>
            </PublicRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="events" element={<EventsManagement />} />
          <Route path="houses" element={<HousesManagement />} />
          <Route path="matchups" element={<MatchupsManagement />} />
          <Route path="attendance" element={<AttendanceReports />} />
          <Route path="points" element={<PointsManagement />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="seasons" element={<SeasonsPage />} />
          <Route path="audit-logs" element={<AuditLogs />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
