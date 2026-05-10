
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import ForgotPasswordModal from "../components/ForgotPasswordModal";

export default function LoginPage() {
    const navigate = useNavigate();
    const [studentId, setStudentId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    
    const { login } = useAuth();

    const handleLogin = async () => {
        try {
            setLoading(true);
            setError("");

            await login({
                student_id: studentId,
                password,
            });

            navigate("/dashboard");

        } catch (err) {
            setError("Invalid student ID or password");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
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
                        className="text-3xl w-fit"
                    >
                        <FaArrowLeft />
                    </button>

                    {/* Center Content */}
                    <div className="flex flex-col flex-1 items-center justify-center">

                        {/* Logo */}
                        <img
                            src="/aclcxp-logo.png"
                            alt="Logo"
                            className="w-24 mb-12"
                        />

                        {/* Form */}
                        <div className="w-full max-w-sm">
                            
                            {/* Error Message */}
                            {error && (
                                <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2">
                                    <p className="text-red-300 text-sm text-center">
                                        {error}
                                    </p>
                                </div>
                            )}

                            {/* Username */}
                            <input
                                type="text"
                                placeholder="Student ID"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                className="w-full mb-4 px-4 py-3 mt-8 rounded-md bg-white text-black outline-none"
                                />

                            {/* Password */}
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-md bg-white text-black outline-none"
                                />

                            {/* Forgot Password */}
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-red-500 text-sm"
                                    >
                                    Forgot Password
                                </button>
                            </div>


                            {/* Login Button */}
                            <button
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full mt-5 py-3 rounded-full bg-white text-[#2E308E] font-bold border-2 border-[#2E308E] disabled:opacity-50"
                                >
                                {loading ? "Logging in..." : "LOG IN"}
                            </button>

                            {/* Sign Up */}
                            <p className="text-center mt-10 text-sm">
                                Don’t have an account yet?{" "}
                                <Link to="/register" className="text-red-500">
                                    Sign Up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                isOpen={showForgotModal}
                onClose={() => setShowForgotModal(false)}
            />
        </>
    );
}