import { Check, X, LoaderCircle, Info } from "lucide-react";

export type VerificationState = { kind: "success" | "error" | "pending" | "info"; title: string; message: string };

export default function VerificationFeedback({ kind, title, message }: VerificationState) {
  const Icon = kind === "success" ? Check : kind === "error" ? X : kind === "pending" ? LoaderCircle : Info;
  const colors = {
    success: "border-emerald-300/40 bg-emerald-950 text-emerald-100",
    error: "border-red-300/40 bg-red-950 text-red-100",
    pending: "border-amber-300/40 bg-amber-950 text-amber-100",
    info: "border-sky-300/40 bg-sky-950 text-sky-100",
  };
  return <div role={kind === "error" ? "alert" : "status"} aria-atomic="true" className={`verification-feedback flex items-start gap-3 rounded-xl border p-4 ${colors[kind]}`}>
    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
      <Icon className={`h-6 w-6 ${kind === "pending" ? "motion-safe:animate-spin" : "verification-icon"}`} strokeWidth={3} />
    </span>
    <div className="min-w-0"><p className="font-semibold">{title}</p><p className="mt-1 text-sm leading-6">{message}</p></div>
  </div>;
}
