import { Link } from "react-router-dom";
import { FaFacebook } from "react-icons/fa";
import { FaPhone } from "react-icons/fa";
import { FaEnvelope } from "react-icons/fa";

export default function Footer() {
    return (
        <footer className="bg-[#1E1E1E] px-4 py-4 font-inter">
            <div className="max-w-6xl mx-auto">
                {/* Top Section - Links (Vertical) */}
                <div className="mb-4">
                    <nav className="flex flex-col gap-2 text-sm">
                        <Link to="/about" className="text-white hover:text-indigo-400" onClick={() => window.scrollTo(0, 0)}>
                            About Page
                        </Link>
                        <Link to="/privacy" className="text-white hover:text-indigo-400" onClick={() => window.scrollTo(0, 0)}>
                            Privacy Policy Page
                        </Link>
                        <Link to="/terms" className="text-white hover:text-indigo-400" onClick={() => window.scrollTo(0, 0)}>
                            Terms of Use Page
                        </Link>
                        <Link to="/connectivity" className="text-white hover:text-indigo-400" onClick={() => window.scrollTo(0, 0)}>
                            Connectivity Test
                        </Link>
                    </nav>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/20 mb-4"></div>

                {/* Middle Section - Social Icons */}
                <div className="flex items-center gap-4 mb-4 ">
    
                    {/* Facebook */}
                    <a
                        href="https://facebook.com/ACLCTacCity"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Facebook"
                        className="
                            w-11 h-11
                            flex items-center justify-center
                            rounded-full
                            bg-white/10
                            text-white
                            hover:bg-blue-600
                            hover:scale-110
                            transition-all duration-300
                            shadow-md
                        "
                    >
                        <FaFacebook size={20} />
                    </a>

                    {/* Phone */}
                    <a
                        href="tel:+639123456789"
                        title="Call Us"
                        className="
                            w-11 h-11
                            flex items-center justify-center
                            rounded-full
                            bg-white/10
                            text-white
                            hover:bg-green-500
                            hover:scale-110
                            transition-all duration-300
                            shadow-md
                        "
                    >
                        <FaPhone size={18} />
                    </a>

                    {/* Email */}
                    <a
                        href="mailto:admissionoffice_aclctacloban@yahoo.com"
                        title="Email Us"
                        className="
                            w-11 h-11
                            flex items-center justify-center
                            rounded-full
                            bg-white/10
                            text-white
                            hover:bg-red-500
                            hover:scale-110
                            transition-all duration-300
                            shadow-md
                        "
                    >
                        <FaEnvelope size={19} />
                    </a>
                </div>

                {/* Bottom Section - Copyright */}
                <div className="text-sm text-white" style={{ fontFamily: 'Inter' }}>
                    © 2026 ACLCxp. All rights reserved.
                </div>
            </div>
        </footer>
    )
}
