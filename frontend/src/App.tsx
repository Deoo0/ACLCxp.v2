import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ConnectivityTestPage from "./pages/ConnectivityTestPage";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Placeholders — for dashboard
const Dashboard = () => <div>Dashboard — coming soon</div>;

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/connectivity" element={<ConnectivityTestPage />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;