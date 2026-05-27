import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaArrowRight, FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import SupportChat from "../../components/ui/SupportChat";

interface House {
    id: number;
    name: string;
    color_code: string;
}

export default function RegisterPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [step, setStep] = useState(1);
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
        if (error) {
            setError("");
        }
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const stepTitles = [
        "",
        "Account Setup",
        "Personal Information",
        "Academic Information",
        "Security Check",
    ];

    const emailRegex = /^[^\s@]+@gmail\.com$/i;

    const validateStep = (): string | null => {
        if (step === 1) {  
            if (!formData.studentId.trim()) {
                return "Student ID is required.";
            }

            if (formData.studentId.length < 6) {
                return "Student ID appears too short.";
            }

            if (!/^\d+$/.test(formData.studentId)) {
                return "Student ID must contain numbers only.";
            }

            if (!formData.email.trim()) {
                return "Email is required.";
            }

            if (!emailRegex.test(formData.email)) {
                return "Enter a valid Gmail address.";
            }
        } else if (step === 2) {
            if (!formData.firstName.trim()) {
                return "First name required.";
            }
            
            if (!formData.lastName.trim()) {
                return "Last name required.";
            }
            if (!/^[a-zA-Z\s'-]{2,}$/.test(formData.firstName)) {
                return "First name contains invalid characters or is too short.";
            }

            if (!/^[a-zA-Z\s'-]{2,}$/.test(formData.middleName) && formData.middleName.trim() !== "") {
                return "Middle name contains invalid characters or is too short.";  
            }
            
            if (!/^[a-zA-Z\s'-]{2,}$/.test(formData.lastName)) {    
                return "Last name contains invalid characters or is too short.";
            }      
            
        } else if (step === 3) {
            if (!formData.program) {
                return "Program required.";
            }

            if (!formData.yearLevel) {
                return "Year level required.";
            }

            if (!formData.houseId) {
                return "Please select a house.";
            }
        } else if (step === 4) {
            if (formData.password.length < 8) {
                return "Password must be at least 8 characters.";
            }

            if (
                formData.password !==
                formData.confirmPassword
            ) {
                return "Passwords do not match.";
            }

            if (!acceptTerms) {
                return "Accept Terms of Use.";
            }

            if (!acceptPrivacy) {
                return "Accept Privacy Policy.";
            }
        } return null;
    };

    const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (error) {
            setError("");
        }
        const val = e.target.value.replace(/\D/g, "");
        setFormData((prev) => ({
            ...prev,
            studentId: val,
        }));
    };

    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptPrivacy, setAcceptPrivacy] = useState(false);

    const handleKeyDown = (
        e: React.KeyboardEvent
    ) => {
        if (e.key !== "Enter") return;

        if (step < 4) {
            handleNext();
        } else {
            handleRegister();
        }
    };

    const handleNext = async () => {
        if (loading) return;
        const validationError = validateStep();

        if (validationError) {
            setError(validationError);
            return;
        }

        if (step === 1) {
            const availabilityError =
                await checkAvailability();

            if (availabilityError) {
                setError(availabilityError);
                return;
            }
        }

        setError("");
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setError("");
        setStep(prev => prev - 1);
    };

    const checkAvailability = async (): Promise<string | null> => {
    try {
        await api.post("/users/register/", {
            student_id: formData.studentId,
            email: formData.email,
        });

        return null;
    } catch (err: any) {
        const status = err?.response?.status;
        const data = err?.response?.data;

        // Student ID or Email already exists
        if (status === 409) {
            return data?.message;
        }

        // Ignore missing-field validation
        if (status === 400) {
            const errors = data?.errors ?? {};

            if (errors.student_id) {
                return errors.student_id[0];
            }

            if (errors.email) {
                return errors.email[0];
            }

            return null;
        }

        return "Unable to verify account.";
    }
};

    const handleRegister = async () => {
        if (loading) return;
        const validationError = 
            await validateStep();
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
                middle_name: formData.middleName.trim() || "",
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
            const data = err?.response?.data;

            if (data?.student_id?.[0]) {
                setError(data.student_id[0]);
                return;
            }

            if (data?.email?.[0]) {
                setError(data.email[0]);
                return;
            }

            if (data?.password?.[0]) {
                setError(data.password[0]);
                return;
            }

            setError(
                data?.detail ??
                "Registration failed."
            );
        } finally {
            setLoading(false);
        }
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
                <div className="flex flex-1 items-start justify-center py-4">
                    <div className="w-full max-w-2xl mx-auto bg-transparent md:bg-white/10 md:backdrop-blur-md md:border md:border-white/10 md:rounded-3xl p-8 md:shadow-2xl">
                        
                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#D91B22] transition-all duration-300"
                                    style={{
                                        width: `${(step / 4) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex w-full justify-center gap-10 mb-6">
                            {[1,2,3,4].map((s) => (
                                <div
                                    key={s}
                                    className={`
                                        w-8 h-8 rounded-full
                                        flex items-center justify-center
                                        text-xs font-bold
                                        ${
                                            s <= step
                                            ? "bg-[#D91B22]"
                                            : "bg-white/20"
                                        }
                                    `}
                                >
                                    {s}
                                </div>
                            ))}
                        </div>

                        {/* Logo */}
                        <img
                            src="/aclcxp-logo.png"
                            alt="ACLCxp Logo"
                            className="w-20 mx-auto mb-6"
                        />

                        {/* Title */}
                        <h1 className="text-lg md:text-3xl font-bold text-center mb-6">Create Account</h1>

                        {/* Step Title */}
                        <h2 className="text-center text-xs mb-2">
                            {stepTitles[step]}
                        </h2>

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
                        {step === 1 && (
                        <>
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
                                    className="w-full px-4 py-3 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
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
                                    className="w-full px-4 py-3 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
                                />
                            </div>
                        </>
                        )}
                        {step === 2 && (
                            <>
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
                                    className="w-full px-4 py-3 mb-1 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
                                />
                            
                                {/* Middle Name */}
                                <input
                                    type="text"
                                    name="middleName"
                                    placeholder="Middle name (optional)"
                                    value={formData.middleName}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-4 py-3 mb-1 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
                                />

                                {/* Last Name */}
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Last name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-4 py-3 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
                                />
                            </div>
                            </>
                        )}
                        {step === 3 && (
                            <>
                            {/* Program */}
                            <div>
                                <label className="text-xs text-white/70 mb-1 block">Program *</label>
                                <select
                                    name="program"
                                    value={formData.program}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
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
                                    className="w-full px-4 py-3 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
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
                                    className="w-full px-4 py-3 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
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
                        </>
                        )}
                        {step === 4 && (
                        <>
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
                                    className="w-full px-4 py-3 pr-12 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
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
                                    className="w-full px-4 py-3 pr-12 rounded-xl bg-white text-black outline-none focus:ring-2 focus:ring-[#2E308E]"
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
                                        Terms of Use
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
                        </>
                        )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex py-3 gap-3 mt-15">
                            {step > 1 && (
                                <button
                                    onClick={handleBack}
                                    className="flex-1 py-3 rounded-lg border-2 border-white/50 bg-white/10 text-white font-arcade font-bold text-xl hover:bg-white/20 hover:border-white/20 hover:text-white transition-all"
                                >
                                    Back
                                </button>
                            )}

                            {step < 4 ? (
                                <button
                                    onClick={handleNext}
                                    className="flex-1 py-3 rounded-lg border-2 border-black bg-[#D91B22] text-white font-arcade font-bold text-xl hover:bg-black/50 hover:border-[#D91B22] hover:text-[#D91B22] transition-all"
                                >
                                    <FaArrowRight className="mx-auto" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleRegister}
                                    disabled={loading || loadingHouses}
                                    className="flex-1 py-3 rounded-lg border-2 border-black bg-[#D91B22] text-white font-arcade text-xl hover:bg-black/50 hover:border-[#D91B22] hover:text-[#D91B22] transition-all"
                                >
                                    {loading
                                        ? "Creating Account..."
                                        : "SIGN UP"}
                                </button>
                            )}
                        </div>

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