import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import LoadingScreen from "../../components/feedback/LoadingScreen";    
import ForgotPasswordModal from "../../components/ui/ForgotPasswordModal";
import SupportChat from "../../components/ui/SupportChat";

export default function LoginPage() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [loading, setLoading] = useState(false);  
  const [showTransition, setShowTransition] = useState(false);
  const { login } = useAuth();

  const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setStudentId(val);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= 18) setPassword(e.target.value);
  };

  const handleLogin = async () => {
    
    if (!studentId.trim()) {
      setError("Please enter your Student ID.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      setShowTransition(true);      
      await new Promise(resolve => setTimeout(resolve, 1500));

      const loggedInUser = await login({
        student_id: studentId,
        password,
      });
      
      if (loggedInUser.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }

    } catch (err: any) {
      setShowTransition(false);
      setLoading(false);

      const status = err?.response?.status;

      if (status === 400) {
        setError("Please fill in all required fields.");  
      } else if (status === 401) {
        setError("Incorrect Student ID or Password. Please try again.");
      } else if (status === 403) {
        setError("Your account is disabled. Please approach the SSC for assistance.");
      } else if (status === 404) {
        setError("No account found with that Student ID. Please register first.");
      } else {
        setError("Something went wrong.");
      }
    } 
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  if (showTransition) {
    return <LoadingScreen />;
  }

  return (
    <>
      <SupportChat />
      <section className="relative min-h-screen overflow-hidden">

        {/* Background */}
        <img
          src="/aclcxp-bg.png"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-screen px-5 py-8 text-white">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="text-3xl w-fit hover:text-gray-300 transition-colors"
            aria-label="Go back"
          >
            <FaArrowLeft />
          </button>

          {/* Center Content */}
          <div className="flex flex-1 items-center justify-center py-4">
            <div
              className="
                            w-full
                            max-w-xl
                            rounded-3xl
                            p-8
                            bg-transparent
                            md:bg-white/10
                            md:backdrop-blur-md
                            md:border md:border-white/10
                            md:shadow-2xl
                        "
            >
              {/* Logo */}
              <img
                src="/aclcxp-logo.png"
                alt="ACLCxp Logo"
                className="w-24 mx-auto mb-8"
              />

              {/* Error Message */}
              {error && (
                <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3">
                  <p className="text-red-300 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Student ID */}
              <div className="mb-4">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Student ID"
                  value={studentId}
                  onChange={handleStudentIdChange}
                  onKeyDown={handleKeyDown}
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyDown={handleKeyDown}
                  maxLength={18}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <FaEyeSlash size={18} />
                  ) : (
                    <FaEye size={18} />
                  )}
                </button>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-white/40">
                  {password.length}/18
                </span>

                <button
                  onClick={() => setShowForgotModal(true)}
                  className="text-[#D91B22] text-sm hover:text-red-400"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full mt-6 py-3 rounded-full bg-white text-[#2E308E] font-bold hover:bg-gray-100 transition-all"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              {/* Sign Up */}
              <p className="text-center mt-8 text-sm text-white/80">
                Don't have an account yet?{" "}
                <Link
                  to="/register"
                  className="text-[#D91B22] font-semibold hover:text-red-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </>
  );
}
