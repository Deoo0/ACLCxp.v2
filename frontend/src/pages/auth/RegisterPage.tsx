import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { FaCamera, FaKeyboard, FaArrowLeft } from "react-icons/fa";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../services/api";
import { errorMessage } from "../../services/queries";
import SupportChat from "../../components/ui/SupportChat";

const ticketPattern = /^(\d{6}|\d{12})$/;

export default function RegisterPage() {
  const navigate = useNavigate(); const scannerRef = useRef<Html5Qrcode | null>(null); const scanningRef = useRef(false);
  const [step, setStep] = useState<"ticket" | "student" | "account" | "complete">("ticket"); const [mode, setMode] = useState<"choose" | "manual" | "scanner">("choose");
  const [ticketNumber, setTicketNumber] = useState(""); const [studentNumber, setStudentNumber] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState("");
  const [ticketToken, setTicketToken] = useState(""); const [activationToken, setActivationToken] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [cameraError, setCameraError] = useState("");
  const stopCamera = async () => {
    scanningRef.current = false;
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner?.isScanning) await scanner.stop().catch(() => undefined);
  };
  const verifyTicket = async (value: string, field: "ticket_number" | "qr_token") => {
    setLoading(true);
    setError("");
    await stopCamera();
    try {
      const response = await api.post("/auth/registration/verify-ticket/", { [field]: value });
      setTicketToken(response.data.data.verification_token);
      setStep("student");
      setMode("choose");
    } catch (err) {
      setError(errorMessage(err));
      // A decoded but rejected QR stops the camera. Offer a fresh scan or manual entry.
      setMode(current => current === "scanner" ? "choose" : current);
    } finally { setLoading(false); }
  };
  useEffect(() => () => { void stopCamera(); }, []);
  useEffect(() => {
    if (mode !== "scanner") return;
    let cancelled = false;
    const openCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setCameraError("Camera access is not supported in this browser. Please enter your ticket number manually."); return; }
      try {
        // This effect runs only after React has mounted #ticket-qr-reader.
        const scanner = new Html5Qrcode("ticket-qr-reader", { verbose: false });
        scannerRef.current = scanner;
        scanningRef.current = true;
        const reader = document.getElementById("ticket-qr-reader");
        // Keep decoder crop and the visible guide in sync at 72% of the viewport.
        // This leaves enough live camera context around the code on phones and laptops.
        const scanSize = Math.max(180, Math.floor((reader?.clientWidth || 360) * 0.72));
        await scanner.start(
          // html5-qrcode accepts a facing-mode string (or { exact: ... }), not { ideal: ... }.
          // "environment" selects the rear camera on mobile and the available camera on desktop.
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: scanSize, height: scanSize }, aspectRatio: 1 },
          async (decodedText) => {
            if (cancelled || !scanningRef.current) return;
            scanningRef.current = false;
            const value = decodedText.trim();
            // Text QR codes contain the printed number; official QR codes contain an opaque token.
            // Keep numbers as strings so leading zeroes are preserved.
            await verifyTicket(value, ticketPattern.test(value) ? "ticket_number" : "qr_token");
          },
          () => undefined,
        );
        if (cancelled) await scanner.stop().catch(() => undefined);
      } catch (err: unknown) {
        if (!cancelled) {
          console.error("Unable to start ticket QR scanner", err);
          stopCamera();
          const cameraFailure = err instanceof Error ? err : new Error(String(err));
          const message = cameraFailure.name === "NotAllowedError" || cameraFailure.name === "PermissionDeniedError"
            ? "Camera permission was denied. Allow camera access in your browser settings or enter your ticket number manually."
            : cameraFailure.name === "NotFoundError"
              ? "No camera was found on this computer. Connect or enable a camera, or enter your ticket number manually."
              : cameraFailure.name === "NotReadableError"
                ? "The camera is already in use by another app or browser tab. Close it, then try again."
                : `We could not start the camera${cameraFailure.message ? `: ${cameraFailure.message}` : ". Please try again or enter your ticket number manually."}`;
          setCameraError(message);
        }
      }
    };
    // React Strict Mode runs effects twice locally. Deferring one tick means
    // the development-only test effect cleans up before camera access begins.
    const timer = window.setTimeout(() => { void openCamera(); }, 0);
    return () => { window.clearTimeout(timer); cancelled = true; stopCamera(); };
  // The scanner is deliberately created only when this view is mounted.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);
  const submitManual = () => { if (!ticketPattern.test(ticketNumber)) { setError("Enter a 6-digit or 12-digit ticket number."); return; } verifyTicket(ticketNumber, "ticket_number"); };
  const startScanner = () => { setCameraError(""); setError(""); setMode("scanner"); };
  const verifyStudent = async () => { if (!studentNumber.trim()) { setError("Enter your Student Number."); return; } setLoading(true); setError(""); try { const response = await api.post("/auth/registration/verify-student/", { student_number: studentNumber.trim().toUpperCase(), ticket_verification_token: ticketToken }); setActivationToken(response.data.data.activation_token); setStep("account"); } catch (err) { setError(errorMessage(err)); } finally { setLoading(false); } };
  const activate = async () => { if (!email || !password) { setError("Email and password are required."); return; } if (password !== confirmPassword) { setError("Passwords do not match."); return; } setLoading(true); setError(""); try { await api.post("/auth/registration/activate/", { activation_token: activationToken, email, password }); setStep("complete"); } catch (err) { setError(errorMessage(err)); } finally { setLoading(false); } };
  const resetTicket = () => { stopCamera(); setMode("choose"); setError(""); setCameraError(""); }; const stage = step === "ticket" ? 1 : step === "student" ? 2 : 3;
  return <><SupportChat /><section className="relative min-h-screen overflow-hidden text-white"><img src="/aclcxp-bg.png" alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-black/70" /><main className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-6 sm:px-5 sm:py-10"><div className="auth-panel-enter w-full rounded-3xl border border-white/15 bg-slate-950/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7 md:p-9">
    <button onClick={() => step === "ticket" ? navigate("/") : setStep(step === "account" ? "student" : "ticket")} className="mb-5 flex items-center gap-2 text-sm text-white/80"><FaArrowLeft /> Back</button><img src="/aclcxp-logo.png" alt="ACLCxp" className="mx-auto mb-6 w-20" />
    <div className="mb-7 flex items-center justify-between gap-3 text-xs font-semibold text-white/70"><span className={stage >= 1 ? "text-yellow-300" : ""}>1. Verify Ticket</span><span className={stage >= 2 ? "text-yellow-300" : ""}>2. Verify Student</span><span className={stage >= 3 ? "text-yellow-300" : ""}>3. Activate</span></div>{error && <div role="alert" className="mb-5 rounded-xl border border-red-400/40 bg-red-500/15 p-3 text-center text-sm text-red-100">{error}</div>}
    {step === "ticket" && <><h1 className="text-center text-2xl font-bold">Verify Your Intramurals Ticket</h1><p className="mt-2 text-center text-sm text-white/70">Scan your official ticket QR code, scan a QR containing its 6- or 12-digit ticket number, or enter the number manually.</p>{mode === "choose" && <div className="mt-7 grid gap-3 sm:grid-cols-2"><button onClick={startScanner} className="rounded-xl border border-yellow-300 bg-yellow-300 p-5 font-semibold text-black"><FaCamera className="mx-auto mb-2 text-2xl" />Scan Ticket QR Code</button><button onClick={() => setMode("manual")} className="rounded-xl border border-white/25 p-5 font-semibold"><FaKeyboard className="mx-auto mb-2 text-2xl" />Enter Ticket Number</button></div>}{mode === "manual" && <div className="mt-7 space-y-4"><label className="block text-sm">Ticket Number<input autoFocus inputMode="numeric" maxLength={12} value={ticketNumber} onChange={(e) => setTicketNumber(e.target.value.replace(/\D/g, ""))} placeholder="6 or 12 digits" className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-black" /></label><button disabled={loading} onClick={submitManual} className="w-full rounded-xl bg-yellow-300 py-3 font-bold text-black disabled:opacity-60">{loading ? "Verifying…" : "Verify Ticket"}</button><button onClick={resetTicket} className="w-full text-sm underline">Choose another method</button></div>}{mode === "scanner" && <div className="mt-6 text-center"><div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-yellow-300 bg-black shadow-[0_0_30px_rgba(253,224,71,0.2)]"><div id="ticket-qr-reader" className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" /><div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-yellow-300 shadow-[0_0_0_999px_rgba(0,0,0,0.38)]"><span className="absolute -left-1 -top-1 h-7 w-7 rounded-tl-lg border-l-4 border-t-4 border-white" /><span className="absolute -right-1 -top-1 h-7 w-7 rounded-tr-lg border-r-4 border-t-4 border-white" /><span className="absolute -bottom-1 -left-1 h-7 w-7 rounded-bl-lg border-b-4 border-l-4 border-white" /><span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-br-lg border-b-4 border-r-4 border-white" /></div></div><p className="mt-3 text-sm text-white/80">{loading ? "Checking your ticket…" : "Align the entire QR code inside the yellow frame. Hold steady until it scans automatically."}</p>{cameraError && <p role="alert" className="mt-3 text-sm text-red-200">{cameraError}</p>}<button onClick={resetTicket} className="mt-4 rounded-lg border border-white/30 px-4 py-2 text-sm">Cancel / enter manually</button></div>}</>}
    {step === "student" && <><h1 className="text-center text-2xl font-bold">Verify Student Identity</h1><p className="mt-2 text-center text-sm text-white/70">Enter the Student Number assigned by the school.</p><div className="mt-7 space-y-4"><label className="block text-sm">Student Number<input autoFocus autoComplete="username" spellCheck={false} value={studentNumber} onChange={(e) => setStudentNumber(e.target.value.toUpperCase())} placeholder="e.g. 2026-12345" className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-black" /></label><button disabled={loading} onClick={verifyStudent} className="w-full rounded-xl bg-yellow-300 py-3 font-bold text-black disabled:opacity-60">{loading ? "Verifying…" : "Verify Student"}</button></div></>}
    {step === "account" && <><h1 className="text-center text-2xl font-bold">Activate Account</h1><p className="mt-2 text-center text-sm text-white/70">Your school record will be used for your profile.</p><div className="mt-7 space-y-4"><label className="block text-sm">Gmail address<input autoComplete="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Gmail address" className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-black" /></label><label className="block text-sm">Password (8+ characters)<input autoComplete="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ characters)" className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-black" /></label><label className="block text-sm">Confirm password<input autoComplete="new-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-black" /></label><button disabled={loading} onClick={activate} className="w-full rounded-xl bg-yellow-300 py-3 font-bold text-black disabled:opacity-60">{loading ? "Activating…" : "Activate Account"}</button></div></>}
    {step === "complete" && <div className="py-8 text-center"><div className="text-5xl text-green-300">✓</div><h1 className="mt-4 text-2xl font-bold">Account Activated Successfully</h1><p className="mt-3 text-sm text-white/75">Your student account has been verified and activated.</p><Link to="/login" className="mt-7 inline-block rounded-xl bg-yellow-300 px-6 py-3 font-bold text-black">Proceed to Login</Link></div>}{step !== "complete" && <p className="mt-7 text-center text-sm text-white/70">Already activated? <Link to="/login" className="font-semibold text-yellow-300 underline">Log in</Link></p>}
  </div></main></section></>;
}
