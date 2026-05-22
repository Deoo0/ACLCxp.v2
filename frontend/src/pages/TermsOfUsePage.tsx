import Header from "../components/layouts/Header";
import Footer from "../components/layouts/Footer";

const sections = [
    {
        title: "1. Acceptance of Terms",
        content: `By accessing or using ACLCxp: A Cloud‑based Event Tracking System (the "System"), you agree to be bound by these Terms of Use. If you represent a user category (student, faculty, organizer, administrator, or staff) of ACLC College of Tacloban, your continued use of ACLCxp constitutes acceptance of these terms. If you do not agree with any part of these terms, you must refrain from using the System.`,
    },
    {
        title: "2. Changes to Terms",
        content: `The developing team (Team Praxys) and ACLC College of Tacloban reserve the right to update or modify these Terms of Use at any time. Material changes will be posted on the System or via institutional notice, and the "Last Updated" date will be revised. Your continued use of ACLCxp after such changes indicates acceptance of the updated terms.`,
    },
    {
        title: "3. Service Description",
        content: `ACLCxp is a cloud‑based web platform designed to digitalize and automate school‑wide event management and attendance tracking. The System enables online event registration, attendance monitoring, digital merit tracking, event analytics, and results management for ACLC College of Tacloban. It replaces traditional paper‑based merit sheets with a QR‑code and facial recognition–based attendance system and supports live leaderboard updates and house‑point computation.`,
    },
    {
        title: "4. User Accounts and Responsibilities",
        content: `A user account is required to access role‑specific features of ACLCxp. Users receive role‑based authentication (e.g., student, faculty, organizer, administrator) assigned by ACLC College of Tacloban or delegated organizers. You are responsible for maintaining the confidentiality of your login credentials and for all activities occurring under your account. You must promptly notify the designated system administrator or Team Praxys if you suspect unauthorized access to your account.`,
    },
    {
        title: "5. Acceptable Use Policy",
        content: `You agree to use ACLCxp solely for lawful, educational, and institutional purposes aligned with the mission of ACLC College of Tacloban. You may not:`,
        bullets: [
            "Attempt to gain unauthorized access to other user accounts or system data.",
            "Interfere with or disrupt the operation of the System (e.g., denial‑of‑service attempts, scraping, or reverse engineering).",
            "Use the System to distribute malicious software or to engage in harassment or fraudulent activities.",
        ],
        note: "Any violation of this Acceptable Use Policy may result in account suspension or termination and may be reported to the appropriate school authorities.",
    },
    {
        title: "6. Attendance Verification using QR Codes and Facial Recognition",
        content: `ACLCxp uses QR codes and facial recognition technology to verify attendance at school events. Attendees must present a valid QR code and, where applicable, allow facial verification as part of the check‑in process. Participation in facial recognition is required for verification and attendance logging purposes under the System's intended use. Users are prohibited from sharing or misusing QR codes or attempting to circumvent facial recognition for fraudulent attendance.`,
        note: "(This section is subject to update as features are finalized.)",
    },
    {
        title: "7. Data Accuracy and User Responsibility",
        content: `Users are responsible for providing accurate and up‑to‑date information in their profiles, event registrations, and related submissions. Event organizers and administrators are responsible for configuring events correctly and ensuring that attendance logs, house points, and merit records are reviewed and corrected promptly when errors are identified. ACLCxp is designed to support accurate record‑keeping but does not guarantee error‑free data entry by users.`,
    },
    {
        title: "8. Intellectual Property Rights",
        content: `All rights, title, and interest in the ACLCxp software, interface, documentation, and underlying technology are owned by Team Praxys and ACLC College of Tacloban, as applicable. The System may contain trade secrets, proprietary algorithms, and copyrighted materials. You may not copy, reproduce, reverse engineer, or create derivative works from the System without prior written permission. Limited use of the System is granted solely as a licensed service for institutional event management.`,
    },
    {
        title: "9. System Availability and Maintenance",
        content: `ACLCxp is provided on an "as‑is" and "as‑available" basis. The System may be subject to temporary downtime for maintenance, updates, or unforeseen technical issues. While efforts will be made to provide advance notice for scheduled maintenance, ACLCxp does not guarantee uninterrupted, error‑free, or feature‑complete availability at all times. Users are advised to plan critical event‑related activities accordingly.`,
    },
    {
        title: "10. Limitation of Liability",
        content: `To the fullest extent permitted by law, Team Praxys, ACLC College of Tacloban, and their affiliates shall not be liable for any indirect, incidental, consequential, or punitive damages arising from or related to the use of ACLCxp. This includes but is not limited to loss of data, reputational harm, or attendance‑related disputes. The System's outputs are intended as operational aids, not as exhaustive legal or disciplinary records.`,
    },
    {
        title: "11. Termination or Suspension of Accounts",
        content: `ACLCxp reserves the right to suspend or terminate user accounts that violate these Terms of Use, attempt to misuse the System, or are reported for fraudulent or policy‑violating behavior. Termination may occur without prior notice in cases of severe misuse. In such cases, affected users may appeal through the designated institutional channels of ACLC College of Tacloban.`,
    },
    {
        title: "12. Amendments to the Terms",
        content: `These Terms of Use may be amended at any time to reflect changes in system features, regulatory requirements, or institutional policies. Users will be notified of material changes via the System or institutional communication. Continued use of ACLCxp constitutes acceptance of the amended terms.`,
    },
    {
        title: "13. Contact Information",
        content: `For questions, concerns, or reports related to the ACLCxp Terms of Use, please contact:`,
        contact: true,
    },
];

export default function TermsOfUsePage() {
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
                        TERMS OF <span className="text-[#D91B22]">USE</span>
                    </h1>
                    <p className="text-white/70 text-sm mt-2">Last Updated: May 9, 2026</p>
                </div>
            </section>

            {/* Content */}
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">

                {/* Intro notice */}
                <div className="mb-8 p-4 bg-[#EAEAEA] border-l-4 border-[#D91B22] rounded-r-lg text-sm text-gray-600 leading-relaxed">
                    By using ACLCxp, you agree to these Terms of Use. Please read them carefully before
                    accessing or using the System.
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
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#D91B22] flex-shrink-0 mt-1.5" />
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