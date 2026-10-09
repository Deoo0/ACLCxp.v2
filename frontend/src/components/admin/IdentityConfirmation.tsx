import { primary, button } from "./ConsoleUI";
export type StudentIdentity = { full_name: string; student_id: string; house_name: string; identity_proof: string };
export default function IdentityConfirmation({ student, onConfirm, onCancel }: { student: StudentIdentity; onConfirm: () => void; onCancel: () => void }) {
  return <div role="dialog" aria-label="Verify student identity" className="my-4 space-y-3 rounded-xl border border-amber-300/30 bg-neutral-900 p-4">
    <h3 className="font-semibold text-white">Verify the person presenting this pass</h3>
    <p className="text-lg text-white">{student.full_name || "Name unavailable"}</p>
    <p className="font-mono text-neutral-200">{student.student_id}</p><p className="text-neutral-300">{student.house_name}</p>
    <p className="text-sm text-neutral-400">Compare these account details with the student and their school ID. A QR code alone does not prove ownership. Confirm only after verifying identity and attendance.</p>
    <div className="flex flex-wrap gap-2"><button type="button" className={primary} onClick={onConfirm}>Identity verified · record attendance</button><button type="button" className={button} onClick={onCancel}>Cancel</button></div>
  </div>;
}
