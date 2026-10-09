import { primary, button } from "./ConsoleUI";
export type StudentIdentity = { full_name: string; student_id: string; house_name: string; identity_proof: string };
export default function IdentityConfirmation({ student, onConfirm, onCancel, context }: { student: StudentIdentity; onConfirm: () => void; onCancel: () => void; context?: string }) {
  const cancel = useRef<HTMLButtonElement>(null);
  return <Dialog.Root open onOpenChange={open => { if (!open) onCancel(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm" />
    <Dialog.Content aria-label="Verify student identity" onCloseAutoFocus={event => event.preventDefault()} onOpenAutoFocus={event => { event.preventDefault(); cancel.current?.focus(); }} className="fixed left-1/2 top-1/2 z-[81] max-h-[90dvh] w-[calc(100%-24px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-amber-300/30 bg-neutral-900 p-5 text-neutral-200 shadow-2xl sm:p-6">
      <ShieldCheck className="h-7 w-7 text-amber-300" aria-hidden="true" />
      <Dialog.Title className="mt-3 text-xl font-semibold text-white">Verify student identity</Dialog.Title>
      <Dialog.Description className="mt-2 text-sm leading-6 text-neutral-400">Compare these account details with the student and their school ID. Confirm only after checking identity and attendance.</Dialog.Description>
      {context && <p className="mt-3 break-words text-sm text-amber-200">{context}</p>}
      <dl className="my-5 space-y-4 rounded-xl border border-white/10 bg-white/[.025] p-4"><div><dt className="text-xs text-neutral-400">Student name</dt><dd className="mt-1 break-words text-lg font-semibold text-white">{student.full_name || "Name unavailable"}</dd></div><div><dt className="text-xs text-neutral-400">Student number</dt><dd className="mt-1 break-words font-mono text-white">{student.student_id}</dd></div><div><dt className="text-xs text-neutral-400">House</dt><dd className="mt-1 break-words text-white">{student.house_name}</dd></div></dl>
      <p className="text-xs leading-5 text-neutral-400">A QR code alone does not prove ownership. No attendance has been saved yet.</p>
      <div className="mt-5 flex flex-col gap-2"><button type="button" className={`${primary} w-full`} onClick={onConfirm}>Identity verified · record attendance</button><button ref={cancel} type="button" className={`${button} w-full`} onClick={onCancel}>Cancel</button></div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
import * as Dialog from "@radix-ui/react-dialog";
import { useRef } from "react";
import { ShieldCheck } from "lucide-react";
