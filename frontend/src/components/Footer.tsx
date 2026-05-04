import { FaFacebook } from "react-icons/fa";
import { FaPhone } from "react-icons/fa";
import { FaEnvelope } from "react-icons/fa";

export default function Footer() {
    return (
        <footer className="bg-[#1E1E1E] px-4 py-4" style={{ fontFamily: 'Inter' }}>
            <div className="max-w-6xl mx-auto">
                {/* Top Section - Links (Vertical) */}
                <div className="mb-4">
                    <nav className="flex flex-col gap-2 text-sm">
                        <a 
                            href="#about" 
                            className="text-white hover:text-indigo-400"
                        >
                        About
                        </a>
                        
                        <a 
                            href="#terms" 
                            className="text-white hover:text-indigo-400"
                        >
                            Terms of Use
                        </a>
                        <a 
                            href="#privacy" 
                            className="text-white  hover:text-indigo-400"
                        >
                            Privacy Policy
                        </a>
                        <a href="#connectivity" className="text-white hover:text-indigo-400">
                            Connectivity Test
                        </a>
                    </nav>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/20 mb-4"></div>

                {/* Middle Section - Social Icons */}
                <div className="flex gap-4 mb-4">
                    {/* Facebook */}
                    <a
                        href="https://facebook.com/ACLCTacCity"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center transition-colors"
                        title="Follow us on Facebook"
                    >
                        <FaFacebook size={26}/>
                    </a>

                    {/* Contact Number */}
                    <a 
                        href="tel:+639123456789" 
                        className="flex items-center gap-2 hover:text-white"
                    >
                        <FaPhone size={23}/>
                    </a>

                    {/* Email */}
                    <a href="mailto:admissionoffice_aclctacloban@yahoo.com" className="flex items-center gap-2 hover:text-white">
                        <FaEnvelope size={26}/>
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
