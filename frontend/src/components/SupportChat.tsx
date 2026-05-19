import { useState, useRef, useEffect } from "react";
import { FaCommentDots, FaTimes, FaChevronDown } from "react-icons/fa";

// ── Types ──────────────────────────────────────────────────────────────────
interface Message {
    id: number;
    from: "bot" | "user";
    text: string;
}

interface FAQ {
    keywords: string[];
    answer: string;
    suggestions?: string[];
}

// ── FAQ Knowledge Base ─────────────────────────────────────────────────────
const faqs: FAQ[] = [
    {
        keywords: ["what is", "aclcxp", "about", "system", "app", "platform"],
        answer:
            "ACLCxp is a cloud-based event tracking system for ACLC College of Tacloban. It handles event registration, QR attendance, house point tracking, and live leaderboards — replacing traditional paper-based merit sheets.",
        suggestions: ["How do I log in?", "How do house points work?"],
    },
    {
        keywords: ["login", "log in", "sign in", "access", "can't login", "cannot login"],
        answer:
            "To log in, enter your Student ID (numbers only) and your password on the Login page. If you're having trouble, use the 'Forgot Password?' link on the login screen.",
        suggestions: ["I forgot my password", "How do I create an account?"],
    },
    {
        keywords: ["forgot", "reset", "password", "recover"],
        answer:
            "Tap 'Forgot Password?' on the login page. You'll be guided through a reset process. If you still can't access your account, contact your school administrator.",
        suggestions: ["How do I log in?", "Contact info"],
    },
    {
        keywords: ["register", "create account", "sign up", "new account", "how to create"],
        answer:
            "Tap 'Sign Up' on the login page and fill in your details. You'll need your Student ID and a valid email address. Once registered, you can log in right away.",
        suggestions: ["How do I log in?", "What is ACLCxp?"],
    },
    {
        keywords: ["without account", "no account", "guest", "register without", "without creating"],
        answer:
            "You can browse the landing page and view public event information without an account. However, to check in to events, view your merit points, or see house standings, you'll need to be logged in.",
        suggestions: ["How do I create an account?", "How do I log in?"],
    },
    {
        keywords: ["qr", "attendance", "check in", "scan", "check-in"],
        answer:
            "Each event has a unique QR code. When you arrive, scan it using your phone or present it to a scanner at the venue. Your attendance is logged instantly. Make sure you're registered and logged in before scanning.",
        suggestions: ["How do house points work?", "How do I view events?"],
    },
    {
        keywords: ["house", "points", "merit", "leaderboard", "standings", "score"],
        answer:
            "House points are earned by attending and participating in school events. Points are tallied per house and displayed on a live leaderboard. Your personal points history is visible in your dashboard after logging in.",
        suggestions: ["How does QR attendance work?", "How do I view events?"],
    },
    {
        keywords: ["events", "view events", "upcoming", "ongoing", "event list", "activities"],
        answer:
            "Published events are shown on the landing page under 'Ongoing Events'. Once logged in, your dashboard will show upcoming events you can register for and attend.",
        suggestions: ["How does QR attendance work?", "How do house points work?"],
    },
    {
        keywords: ["contact", "reach", "support", "help", "email", "address", "admin"],
        answer:
            "For support, reach ACLC College of Tacloban at:\n📍 352 Real St. Tacloban City, Philippines 6500\n📘 facebook.com/ACLCTacCity\n📧 admissionoffice_aclctacloban@yahoo.com",
        suggestions: ["What is ACLCxp?", "How do I log in?"],
    },
];

// ── Matching logic ─────────────────────────────────────────────────────────
function getResponse(input: string): { answer: string; suggestions?: string[] } {
    const lower = input.toLowerCase();
    for (const faq of faqs) {
        if (faq.keywords.some((kw) => lower.includes(kw))) {
            return { answer: faq.answer, suggestions: faq.suggestions };
        }
    }
    return {
        answer:
            "I'm not sure about that yet. For more help, contact the school administrator or check the About page.",
        suggestions: ["What is ACLCxp?", "Contact info", "How do I log in?"],
    };
}

// ── Quick replies (shown at start) ────────────────────────────────────────
const quickReplies = [
    "What is ACLCxp?",
    "How do I log in?",
    "How do house points work?",
    "How does QR attendance work?",
    "Contact info",
];

let msgId = 0;
const nextId = () => ++msgId;

// ── Component ──────────────────────────────────────────────────────────────
export default function SupportChat() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: nextId(),
            from: "bot",
            text: "👋 Hi! I'm the ACLCxp support bot. What can I help you with?",
        },
    ]);
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setHasNewMessage(false);
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [open]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const sendMessage = (text: string) => {
        if (!text.trim()) return;
        setShowQuickReplies(false);

        const userMsg: Message = { id: nextId(), from: "user", text: text.trim() };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        setTimeout(() => {
            const { answer, suggestions } = getResponse(text);
            const botMsg: Message = { id: nextId(), from: "bot", text: answer };
            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);

            if (suggestions && suggestions.length > 0) {
                // add suggestion chips as a special bot message
                const chipMsg: Message = {
                    id: nextId(),
                    from: "bot",
                    text: `__chips__${suggestions.join("|")}`,
                };
                setMessages((prev) => [...prev, chipMsg]);
            }

            if (!open) setHasNewMessage(true);
        }, 700);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") sendMessage(input);
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-[#2E308E] text-white shadow-lg flex items-center justify-center hover:bg-[#252770] active:scale-95 transition-all duration-200"
                aria-label="Open support chat"
            >
                {open ? (
                    <FaChevronDown size={20} />
                ) : (
                    <>
                        <FaCommentDots size={22} />
                        {hasNewMessage && (
                            <span className="absolute top-1 right-1 w-3 h-3 bg-[#D91B22] rounded-full border-2 border-white" />
                        )}
                    </>
                )}
            </button>

            {/* Chat Window */}
            <div
                className={`fixed bottom-22 right-5 z-50 w-[calc(100vw-40px)] max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
                    open
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 translate-y-4 pointer-events-none"
                }`}
                style={{ maxHeight: "75vh", minHeight: "400px" }}
            >
                {/* Header */}
                <div className="bg-[#2E308E] px-4 py-3 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <FaCommentDots size={14} className="text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm leading-none">ACLCxp Support</p>
                            <p className="text-white/60 text-xs mt-0.5">FAQ Bot</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="text-white/70 hover:text-white transition-colors"
                        aria-label="Close chat"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#F5F5F5]">
                    {messages.map((msg) => {
                        // Chip messages
                        if (msg.from === "bot" && msg.text.startsWith("__chips__")) {
                            const chips = msg.text.replace("__chips__", "").split("|");
                            return (
                                <div key={msg.id} className="flex flex-wrap gap-2 pl-1">
                                    {chips.map((chip) => (
                                        <button
                                            key={chip}
                                            onClick={() => sendMessage(chip)}
                                            className="text-xs bg-white border border-[#2E308E] text-[#2E308E] rounded-full px-3 py-1.5 hover:bg-[#2E308E] hover:text-white transition-all duration-150 font-medium"
                                        >
                                            {chip}
                                        </button>
                                    ))}
                                </div>
                            );
                        }

                        return (
                            <div
                                key={msg.id}
                                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                                        msg.from === "user"
                                            ? "bg-[#2E308E] text-white rounded-br-sm"
                                            : "bg-white text-[#1E1E1E] rounded-bl-sm shadow-sm border border-gray-100"
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}

                    {/* Typing indicator */}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                            </div>
                        </div>
                    )}

                    {/* Quick replies */}
                    {showQuickReplies && !isTyping && (
                        <div className="flex flex-col gap-2 mt-1">
                            {quickReplies.map((qr) => (
                                <button
                                    key={qr}
                                    onClick={() => sendMessage(qr)}
                                    className="text-left text-sm bg-white border border-gray-200 text-[#2E308E] rounded-xl px-4 py-2.5 hover:border-[#2E308E] hover:bg-[#f0f1ff] transition-all duration-150 font-medium shadow-sm"
                                >
                                    {qr}
                                </button>
                            ))}
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-3 py-3 border-t border-gray-100 bg-white flex gap-2 flex-shrink-0">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a question..."
                        className="flex-1 px-4 py-2.5 rounded-full bg-[#F5F5F5] text-sm text-[#1E1E1E] outline-none focus:ring-2 focus:ring-[#2E308E] transition-all"
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim()}
                        className="w-10 h-10 rounded-full bg-[#2E308E] text-white flex items-center justify-center hover:bg-[#252770] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                        aria-label="Send message"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-0.5">
                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
}