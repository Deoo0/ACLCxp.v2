import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import SupportChat from "../components/SupportChat";

interface House {
    id: number;
    name: string;
    color_code: string;
}

export default function RegisterPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [houses, setHouses] = useState<House[]>([]);
    const [loadingHouses, setLoadingHouses] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        studentId: "",
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        middleName: "",
        program: "BSIT",
        yearLevel: "1",
        houseId: "",
    });

    // Fetch houses on mount
    useEffect(() => {
        const fetchHouses = async () => {
            try {
                setLoadingHouses(true);
                const response = await api.get("/houses/");
                
                // Handle different response structures
                let houseList: House[] = [];
                if (Array.isArray(response.data)) {
                    houseList = response.data;
                } else if (Array.isArray(response.data?.results)) {
                    houseList = response.data.results;
                } else if (Array.isArray(response.data?.data)) {
                    houseList = response.data.data;
                }
                
                setHouses(houseList);
                if (houseList.length > 0) {
                    setFormData((prev) => ({
                        ...prev,
                        houseId: String(houseList[0].id),
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch houses:", err);
                setError("Failed to load houses. Please refresh the page.");
            } finally {
                setLoadingHouses(false);
            }
        };
        fetchHouses();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, "");
        setFormData((prev) => ({
            ...prev,
            studentId: val,
        }));
    };

    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptPrivacy, setAcceptPrivacy] = useState(false);

    const validate = (): string | null => {
        const { studentId, email, password, confirmPassword, firstName, lastName, program, yearLevel, houseId } = formData;

        if (!studentId || !email || !password || !confirmPassword || !firstName || !lastName || !program || !yearLevel || !houseId) {
            return "Please fill out all required fields.";
        }

        if (!/^\d+$/.test(studentId)) {
            return "Student ID must contain numbers only.";
        }

        if (!email.toLowerCase().endsWith("@gmail.com")) {
            return "Email must be a @gmail.com address.";
        }

        if (password.length < 8) {
            return "Password must be at least 8 characters long.";
        }

        if (password !== confirmPassword) {
            return "Passwords do not match.";
        }

        if (firstName.trim().length < 2) {
            return "First name must be at least 2 characters.";
        }

        if (lastName.trim().length < 2) {
            return "Last name must be at least 2 characters.";
        }

        const yearLevelNum = parseInt(yearLevel);
        if (yearLevelNum < 1 || yearLevelNum > 4) {
            return "Year level must be between 1 and 4.";
        }

        if (!acceptTerms) {
            return "You must accept the Terms and Conditions.";
        }

        if (!acceptPrivacy) {
            return "You must accept the Privacy Policy.";
        }

        return null;
    };

    const handleRegister = async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);
            setError("");

            await api.post("/users/register/", {
                student_id: formData.studentId,
                email: formData.email.toLowerCase(),
                password: formData.password,
                first_name: formData.firstName.trim(),
                last_name: formData.lastName.trim(),
                middle_name: formData.middleName.trim() || null,
                program: formData.program,
                year_level: parseInt(formData.yearLevel),
                house_id: parseInt(formData.houseId),
            });

            // Auto-login after successful registration
            await login({
                student_id: formData.studentId,
                password: formData.password,
            });

            navigate("/dashboard");
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.response?.data?.detail || "Registration failed. Please try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleRegister();
    };

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
                    <div className="
                        w-full
                        max-w-2xl
                        mx-auto
                        bg-transparent
                        md:bg-white/10
                        md:backdrop-blur-md
                        md:border md:border-white/10
                        md:rounded-3xl
                        p-8
                        md:shadow-2xl
                    ">

                        {/* Logo */}
                        <img
                            src="/aclcxp-logo.png"
                            alt="ACLCxp Logo"
                            className="w-20 mx-auto mb-6"
                        />

                        {/* Title */}
                        <h1 className="text-3xl font-bold text-center mb-6">Create Account</h1>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3">
                                <p className="text-red-300 text-sm text-center">{error}</p>
                            </div>
                        )}

                        {/* Loading Houses */}
                        {loadingHouses && (
                            <div className="mb-4 rounded-xl bg-blue-500/10 border border-blue-500/30 px-4 py-3">
                                <p className="text-blue-300 text-sm text-center">Loading houses...</p>
                            </div>
                        )}

                        {/* Stacked Layout */}
                        <div className="space-y-4 mb-4">
                            {/* Student ID */}
                            <div>
                                <label className="text-xs text-white/70 mb-1 block">Student ID *</label>
                                <input
                                    type="text"
                                    name="studentId"
                                    inputMode="numeric"
                                    placeholder="Enter student ID"
                                    value={formData.studentId}
                                    onChange={handleStudentIdChange}
                                    onKeyDown={handleKeyDown}
                                    maxLength={20}
                                    className="w-full px-4 py-2 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-xs text-white/70 mb-1 block">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="your.email@gmail.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-4 py-2 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
                                />
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="text-xs text-white/70 mb-1 block">Full Name *</label>
                                {/* First Name */}
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="First name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-4 py-2 mb-1 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
                                />
                            
                                {/* Middle Name */}
                                <input
                                    type="text"
                                    name="middleName"
                                    placeholder="Middle name (optional)"
                                    value={formData.middleName}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-4 py-2 mb-1 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
                                />

                                {/* Last Name */}
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Last name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-4 py-2 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
                                />
                            </div>

                            {/* Program */}
                            <div>
                                <label className="text-xs text-white/70 mb-1 block">Program *</label>
                                <select
                                    name="program"
                                    value={formData.program}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
                                >
                                    <option value="BSIT">BSIT</option>
                                    <option value="BSCS">BSCS</option>
                                    <option value="BSHM">BSHM</option>
                                </select>
                            </div>

                            {/* Year Level */}
                            <div>
                                <label className="text-xs text-white/70 mb-1 block">Year Level *</label>
                                <select
                                    name="yearLevel"
                                    value={formData.yearLevel}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
                                >
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>

                            {/* House */}
                            <div>
                                <label className="text-xs text-white/70 mb-1 block">House *</label>
                                <select
                                    name="houseId"
                                    value={formData.houseId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
                                    disabled={loadingHouses || houses.length === 0}
                                >
                                    <option value="">Select your house</option>
                                    {houses.map((house) => (
                                        <option key={house.id} value={String(house.id)}>
                                            {house.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="mb-4">
                            <label className="text-xs text-white/70 mb-1 block">Password (min 8 chars) *</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    maxLength={50}
                                    className="w-full px-4 py-2 pr-12 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="mb-6">
                            <label className="text-xs text-white/70 mb-1 block">Confirm Password *</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    placeholder="Confirm password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    maxLength={50}
                                    className="w-full px-4 py-2 pr-12 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6 text-sm">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                    className="accent-[#2E308E]"
                                />

                                <span>
                                    I Accept the{" "}
                                    <a
                                        href="/terms"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#D91B22] underline"
                                    >
                                        Terms and Conditions
                                    </a>
                                </span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={acceptPrivacy}
                                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                                    className="accent-[#2E308E]"
                                />

                                <span>
                                    I Accept the{" "}
                                    <a
                                        href="/privacy"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#D91B22] underline"
                                    >
                                        Privacy Policy
                                    </a>
                                </span>
                            </label>
                        </div>

                        {/* Register Button */}
                        <button
                            onClick={handleRegister}
                            disabled={loading || loadingHouses}
                            className="w-full py-3 rounded-full bg-[#2E308E] text-white font-bold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating Account..." : "SIGN UP"}
                        </button>

                        {/* Login Link */}
                        <p className="text-center mt-8 text-sm text-white/80">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="text-[#D91B22] font-semibold hover:text-red-400"
                            >
                                Log In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </section>
        </>
    );
}