import Header from "../components/layouts/Header";
import Footer from "../components/layouts/Footer";

const sections = [
    {
        title: "1. Introduction",
        content: `This Privacy Policy explains how ACLCxp: A Cloud‑based Event Tracking System collects, uses, stores, and protects your personal information. The System is developed by Team Praxys and used by ACLC College of Tacloban, its students, faculty, organizers, administrators, and staff. By using ACLCxp, you acknowledge and consent to the data practices described in this policy.`,
    },
    {
        title: "2. Information Collected",
        content: `ACLCxp collects several categories of information to facilitate event registration, attendance tracking, and analytics. This may include:`,
        bullets: [
            "Basic identifiers: Name, student number, email address, and associated organizational details (e.g., department, course, or house).",
            "Event participation records: Event registrations, attendance logs, QR‑code scans, and digital merit entries.",
            "Technical and device data: IP address, browser type, device model, and approximate location derived from network information.",
            "Facial recognition data: Biometric templates and images captured or processed for attendance verification, subject to specific safeguards (see Section 4).",
        ],
    },
    {
        title: "3. How Information is Used",
        content: `The collected information is used for the following purposes:`,
        bullets: [
            "To register and authenticate users and assign appropriate roles within the System.",
            "To validate attendance at events using QR codes and facial recognition.",
            "To compute and update house points, merit records, and live leaderboards.",
            "To generate event‑related analytics, reports, and summaries for institutional review.",
            "To maintain system security and prevent unauthorized access or fraudulent activity.",
        ],
    },
    {
        title: "4. Facial Recognition and Attendance Data",
        content: `ACLCxp may employ facial recognition technology to confirm the presence of registered participants during event check‑ins. Facial images are processed to generate biometric templates that are used solely for verification purposes and are stored in compliance with applicable data protection standards. Access to facial and attendance data is restricted to authorized personnel and system components. Users should note that refusal to participate in facial recognition may limit their ability to use certain attendance‑related features of the System.`,
    },
    {
        title: "5. Cookies and Tracking Technologies",
        content: `The ACLCxp web platform may use cookies and similar tracking technologies to enhance user experience, remember login preferences, and monitor System usage patterns. These technologies may collect information about pages visited, time spent, and interactive behavior. Users may adjust browser settings to manage or disable cookies, but doing so may affect functionality or performance of the System.`,
    },
    {
        title: "6. Data Sharing and Disclosure",
        content: `Personal information collected through ACLCxp may be shared in the following circumstances:`,
        bullets: [
            "With authorized personnel at ACLC College of Tacloban who require access for event management, academic reporting, or administrative purposes.",
            "With third‑party service providers (e.g., cloud hosting, analytics, or notification platforms) that process data on behalf of the System, subject to contractual obligations for confidentiality and security.",
            "When required by law, regulation, or legal process, or to protect the rights, property, or safety of users, the institution, or the public.",
        ],
        note: "Under no circumstances will personal data be sold to third parties for commercial advertising or unrelated marketing.",
    },
    {
        title: "7. Data Security Measures",
        content: `ACLCxp stores data in a cloud‑based environment employing encryption at rest and in transit, strict access controls, and role‑based permissions. Security measures may include multifactor authentication for administrators, regular system audits, and vulnerability monitoring. Despite these safeguards, no electronic system is entirely immune to breaches; therefore, users are encouraged to safeguard their login information and report any suspicious activity promptly.`,
    },
    {
        title: "8. Data Retention",
        content: `Personal information is retained only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, or as required by school policy or applicable laws. Attendance records and event participation data may be archived for academic, administrative, or reporting purposes. Facial recognition templates that are no longer needed for operational purposes may be securely deleted or de‑identified according to institutional guidelines.`,
    },
    {
        title: "9. User Rights and Choices",
        content: `Users may have the right to:`,
        bullets: [
            "Access the personal information held about them through ACLCxp.",
            "Request correction of inaccurate or incomplete data.",
            "Request deletion or deactivation of their account or specific data, subject to retention requirements and legal obligations.",
            "Withdraw consent for certain data processing activities where applicable, though this may limit access to some features of the System.",
        ],
        note: "Requests should be directed to the designated contact (see Section 14) and will be processed in accordance with institutional procedures and applicable law.",
    },
    {
        title: "10. Third‑Party Services and Integrations",
        content: `ACLCxp may integrate with third‑party services such as cloud hosting platforms, analytics tools, or communication channels. These providers process information only for the purposes specified in their agreements and are bound by confidentiality and security obligations. Users are encouraged to review the privacy policies of such third parties, as their practices may differ from this policy.`,
    },
    {
        title: "11. Children's Privacy",
        content: `ACLCxp is designed for use within an educational institution and may be accessed by minors enrolled at ACLC College of Tacloban. The System does not knowingly collect or use personal information from individuals below the applicable legal age for consent without verification of parental or institutional authority. If you believe that a child has provided information without proper authorization, please contact the designated administrator for review.`,
    },
    {
        title: "12. International Data Transfers",
        content: `In cases where data is stored or processed across international borders, ACLCxp and its partners will implement appropriate safeguards such as contractual commitments and technical controls to protect personal information. Data may be transferred to jurisdictions outside the primary country of operation if such transfers comply with applicable data protection regulations and institutional policies.`,
    },
    {
        title: "13. Changes to the Privacy Policy",
        content: `This Privacy Policy may be updated periodically to reflect changes in legal requirements, technological developments, or institutional practices. Users will be notified of material changes through the System or institutional channels, and the "Last Updated" date will be revised. Continued use of ACLCxp after such changes indicates acceptance of the updated policy.`,
    },
    {
        title: "14. Contact Information",
        content: `For questions, concerns, or requests regarding the ACLCxp Privacy Policy, please contact:`,
        contact: true,
    },
];

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            {/* Hero Banner */}
            <section className="relative h-52 overflow-hidden">
                <img
                    src="/aclcxp-bg.png"
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-6 text-center pt-16">
                    <h1 className="text-4xl font-extrabold tracking-wide">
                        PRIVACY <span className="text-[#D91B22]">POLICY</span>
                    </h1>
                    <p className="text-white/70 text-sm mt-2">Last Updated: May 9, 2026</p>
                </div>
            </section>

            {/* Content */}
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">

                {/* Intro notice */}
                <div className="mb-8 p-4 bg-[#EAEAEA] border-l-4 border-[#2E308E] rounded-r-lg text-sm text-gray-600 leading-relaxed">
                    Please read this Privacy Policy carefully. By using ACLCxp, you agree to the collection
                    and use of information as described below.
                </div>

                <div className="space-y-8">
                    {sections.map((s) => (
                        <section key={s.title}>
                            <h2 className="text-lg font-extrabold text-[#2E308E] mb-2">{s.title}</h2>
                            {s.content && (
                                <p className="text-gray-600 text-sm leading-relaxed mb-3">{s.content}</p>
                            )}
                            {s.bullets && (
                                <ul className="space-y-2 mb-3">
                                    {s.bullets.map((b) => (
                                        <li key={b} className="flex gap-3 text-sm text-gray-600">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#D91B22] shrink-0 mt-1.5" />
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {s.note && (
                                <p className="text-sm text-gray-500 italic mt-2">{s.note}</p>
                            )}
                            {s.contact && (
                                <div className="mt-2 text-sm text-gray-600 space-y-1">
                                    <p>📧 <span className="text-gray-400">[Insert Email Address]</span></p>
                                    <p>📍 352 Real St. Tacloban City, Philippines, 6500</p>
                                </div>
                            )}
                            <div className="h-px bg-gray-100 mt-8" />
                        </section>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}