import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ConnectivityTestPage from "./pages/ConnectivityTestPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/connectivity" element={<ConnectivityTestPage />} />
    </Routes>
  );
}

export default App;