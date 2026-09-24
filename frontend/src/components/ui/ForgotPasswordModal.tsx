import * as Dialog from "@radix-ui/react-dialog";
import { X, LockKeyhole } from "lucide-react";

interface ForgotPasswordModalProps { isOpen: boolean; onClose: () => void; }
export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  return <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/70" />
      <Dialog.Content onCloseAutoFocus={(event) => { event.preventDefault(); document.getElementById("forgot-password-trigger")?.focus(); }} className="fixed left-1/2 top-1/2 z-[81] max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/15 bg-neutral-900 p-6 text-white shadow-2xl">
        <Dialog.Close aria-label="Close password help" className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl text-neutral-300 hover:bg-white/10"><X className="h-5 w-5" /></Dialog.Close>
        <LockKeyhole aria-hidden="true" className="mb-5 h-8 w-8 text-amber-400" />
        <Dialog.Title className="pr-8 text-xl font-semibold">Reset your password</Dialog.Title>
        <Dialog.Description className="mt-3 text-sm leading-6 text-neutral-300">For security reasons, password resets must be handled at the SSC Office. Please visit the office to request a password reset.</Dialog.Description>
        <Dialog.Close className="mt-6 min-h-11 w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-neutral-950 hover:bg-amber-300">Got it</Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
