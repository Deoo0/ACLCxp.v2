import { useState, useRef, useEffect } from "react";
import { FaCommentDots, FaTimes, FaChevronDown } from "react-icons/fa";

interface Message {
    id: number;
    from: "bot" | "user";
    text: string;
}

const quickReplies = [
    "What is ACLCxp?",
    "How do I log in?",
    "How do house points work?",
    "How does QR attendance work?",
    "Contact info",
];

let msgId = 0;
const nextId = () => ++msgId;

export default function SupportChat() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: nextId(),
            from: "bot",
            text: "👋 Hi! I'm the ACLCxp support assistant. What can I help you with?",
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

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;
        setShowQuickReplies(false);

        const userMsg: Message = { id: nextId(), from: "user", text: text.trim() };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chat/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text.trim() }),
            });

            const data = await res.json();
            const reply = data.reply || "Sorry, I couldn't get a response. Please try again.";

            setMessages((prev) => [
                ...prev,
                { id: nextId(), from: "bot", text: reply },
            ]);

            if (!open) setHasNewMessage(true);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: nextId(),
                    from: "bot",
                    text: "I'm having trouble connecting right now. Please try again shortly.",
                },
            ]);
        } finally {
            setIsTyping(false);
        }
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
                            <p className="text-white/60 text-xs mt-0.5">AI Assistant</p>
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
                    {messages.map((msg) => (
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
                    ))}

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
                        disabled={!input.trim() || isTyping}
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