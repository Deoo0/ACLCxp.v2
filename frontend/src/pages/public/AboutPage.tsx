// import { useNavigate } from "react-router-dom";
import Header from "../../components/layouts/Header";
import Footer from "../../components/layouts/Footer";
import SupportChat from "../../components/SupportChat";

export default function AboutPage() {
    // const navigate = useNavigate();

    // const team = [
    //     { name: "Team Praxys", role: "Development Team" },
    // ];

    return (
        <>
        <SupportChat />
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            {/* Hero Banner — consistent with login/hero bg usage */}
            <section className="relative h-52 overflow-hidden">
                <img
                    src="/aclcxp-bg.png"
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-6 text-center pt-16">
                    <h1 className="text-4xl font-extrabold tracking-wide">
                        ABOUT <span className="text-[#D91B22]">ACLCxp</span>
                    </h1>
                    <p className="text-white/70 text-sm mt-2 max-w-xs">
                        A Cloud-based Event Tracking System
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 text-[#1E1E1E]">

                {/* What is ACLCxp */}
                <section className="mb-10">
                    <h2 className="text-2xl font-extrabold text-[#2E308E] mb-3">What is ACLCxp?</h2>
                    <p className="text-gray-600 leading-relaxed">
                        ACLCxp is a cloud-based web platform developed for ACLC College of Tacloban,
                        designed to digitalize and automate school-wide event management and attendance
                        tracking. It replaces traditional paper-based merit sheets with a modern system
                        powered by QR codes, live leaderboards, and digital house point computation.
                    </p>
                </section>

                {/* Divider */}
                <div className="h-px bg-gray-200 mb-10" />

                {/* Key Features */}
                <section className="mb-10">
                    <h2 className="text-2xl font-extrabold text-[#2E308E] mb-5">Key Features</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            {
                                title: "QR-based Attendance",
                                desc: "Attendees check in by scanning a unique QR code — fast, paperless, and tamper-resistant.",
                            },
                            {
                                title: "Live Leaderboard",
                                desc: "House points are updated in real time as events progress, keeping competition visible.",
                            },
                            {
                                title: "Digital Merit Tracking",
                                desc: "Every point earned is logged, reviewable, and tied to a specific event or activity.",
                            },
                            {
                                title: "Event Management",
                                desc: "Organizers can create, publish, and manage events — from registration to results.",
                            },
                            {
                                title: "Role-based Access",
                                desc: "Students, faculty, organizers, and admins each see what they need — nothing more.",
                            },
                            {
                                title: "Analytics & Reports",
                                desc: "Summarized event reports and participation data for institutional review.",
                            },
                        ].map((f) => (
                            <div
                                key={f.title}
                                className="bg-[#EAEAEA] p-5 rounded-lg border border-gray-200"
                            >
                                <h3 className="font-bold text-[#2E308E] mb-1">{f.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Divider */}
                <div className="h-px bg-gray-200 mb-10" />

                {/* Who It's For */}
                <section className="mb-10">
                    <h2 className="text-2xl font-extrabold text-[#2E308E] mb-3">Who It's For</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        ACLCxp serves the entire ACLC College of Tacloban community:
                    </p>
                    <ul className="space-y-2">
                        {[
                            ["Students", "Track personal merit points, view events, and check in via QR."],
                            ["Faculty & Staff", "Monitor participation and house standings across the school year."],
                            ["Event Organizers", "Create and manage events, validate attendance, and approve points."],
                            ["Administrators", "Full system oversight — users, events, reports, and configurations."],
                        ].map(([role, desc]) => (
                            <li key={role} className="flex gap-3 text-sm text-gray-600">
                                <span className="w-2 h-2 rounded-full bg-[#D91B22] shrink-0 mt-2" />
                                <span><strong className="text-[#1E1E1E]">{role}:</strong> {desc}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Divider */}
                <div className="h-px bg-gray-200 mb-10" />

                {/* Built By */}
                <section className="mb-10">
                    <h2 className="text-2xl font-extrabold text-[#2E308E] mb-3">Built By</h2>
                    <p className="text-gray-600 leading-relaxed">
                        ACLCxp is developed by <strong>Team Praxys</strong> as a capstone project
                        for ACLC College of Tacloban. The system was designed and built with the
                        institution's operational needs in mind, aiming to modernize how school
                        events are managed and how student participation is recognized.
                    </p>
                    <div className="mt-5 inline-block bg-[#2E308E] text-white px-5 py-3 rounded-lg text-sm font-semibold">
                        Team Praxys — Capstone 2026
                    </div>
                </section>

                {/* Contact */}
                <section>
                    <h2 className="text-2xl font-extrabold text-[#2E308E] mb-3">Contact</h2>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        For inquiries about ACLCxp, reach out through the institution:
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        📍 352 Real St. Tacloban City, Philippines, 6500
                    </p>
                    <p className="text-gray-500 text-sm">
                        📘{" "}
                        <a
                            href="https://facebook.com/ACLCTacCity"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#2E308E] underline hover:text-[#D91B22] transition-colors"
                        >
                            ACLC Tacloban on Facebook
                        </a>
                    </p>
                </section>
            </main>

            <Footer />
        </div>
        </>
    );
}