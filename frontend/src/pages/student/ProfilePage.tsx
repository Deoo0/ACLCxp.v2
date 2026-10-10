import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, Pencil, QrCode, Shield, UserRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Editor, Loading, Notice } from "../../components/admin/ConsoleUI";
import { useApi } from "../../services/queries";
import type { StudentSummary } from "../../components/dashboard/LivePortal";
import { ExperienceCard, ExperienceFrame, ExperienceHeading, MilestoneProgress } from "../../components/dashboard/StudentExperience";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [edit, setEdit] = useState(false);
  const [failedPhoto, setFailedPhoto] = useState("");
  const summary = useApi<StudentSummary>("/portal/summary/");
  if (!user) return null;
  const checklist = [
    { label: "Phone number", done: Boolean(user.phone_number?.trim()) },
    { label: "Emergency contact", done: Boolean(user.contact_person?.trim() && user.contact_number?.trim()) },
    { label: "About you", done: Boolean(user.bio?.trim()) },
  ];
  const complete = checklist.filter(item => item.done).length;
  return <ExperienceFrame>
    <ExperienceHeading eyebrow="Your campus identity" title="Make it yours." description="Keep your details up to date and your event pass close. This is your place on campus."><button className="xp-button" onClick={() => setEdit(true)}><Pencil size={16} /> Edit contact information</button></ExperienceHeading>
    <div className="grid items-start gap-5 lg:grid-cols-[1.35fr_1fr]">
      <ExperienceCard>
        <div className="flex flex-wrap items-center gap-4"><div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-300/25 bg-amber-300/10 text-amber-200">{user.profile_photo && failedPhoto !== user.profile_photo ? <img src={user.profile_photo} alt="Your profile" onError={() => setFailedPhoto(user.profile_photo || "")} className="h-full w-full object-cover" /> : <UserRound size={34} />}</div><div className="min-w-0 flex-1"><span className="xp-tag">Student</span><h2 className="mt-2 break-words text-2xl font-semibold text-white">{user.full_name}</h2><p className="mt-2 break-all font-mono text-xs text-neutral-400">{user.student_id}</p></div></div>
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.025] p-4"><Shield size={19} className="shrink-0 text-amber-300" /><p className="break-words text-sm text-neutral-200">{user.house_name || "House assignment pending"}</p>{user.house_name && <Link to="/stats" aria-label="View your house standings" className="ml-auto xp-text-link"><ArrowUpRight size={18} /></Link>}</div>
        <h3 className="mt-6 text-sm font-semibold text-white">Academic details</h3>
        <dl className="mt-4 space-y-4">{[["Email", user.email], ["Program", user.program], ["Year level", user.year_level]].map(([label, value]) => <div key={label} className="grid gap-1 border-b border-white/10 pb-3 sm:grid-cols-[100px_1fr]"><dt className="text-xs text-neutral-400">{label}</dt><dd className="break-words text-sm text-neutral-200 sm:text-right">{value || "Not provided"}</dd></div>)}</dl>
        <p className="mt-4 text-xs leading-5 text-neutral-400">Ask your school administrator to correct your name, student ID, house, or academic details.</p>
        <h3 className="mt-7 text-sm font-semibold text-white">Contact information</h3><dl className="mt-4 space-y-4">{[["Phone", user.phone_number], ["Emergency contact", user.contact_person], ["Contact number", user.contact_number]].map(([label, value]) => <div key={label} className="grid gap-1 border-b border-white/10 pb-3 sm:grid-cols-[140px_1fr]"><dt className="text-xs text-neutral-400">{label}</dt><dd className="break-words text-sm text-neutral-200 sm:text-right">{value || "Not added yet"}</dd></div>)}</dl>
        {user.bio && <div className="mt-6"><h3 className="text-sm font-semibold text-white">About you</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-400">{user.bio}</p></div>}
      </ExperienceCard>
      <div className="space-y-5"><ExperienceCard><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-white">A little more you</h2><span className="xp-tag">{complete} / 3</span></div><p className="mt-2 text-xs leading-5 text-neutral-400">Optional details help complete your profile. They do not affect your merit points.</p><div className="xp-track mt-5" role="progressbar" aria-label="Profile completion" aria-valuenow={Math.round(complete / 3 * 100)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${complete / 3 * 100}%` }} /></div><ul className="mt-4 space-y-3">{checklist.map(item => <li key={item.label} className="flex items-center gap-3 text-sm text-neutral-300"><span className={`xp-step ${item.done ? "xp-step-done" : ""}`}>{item.done ? <Check size={15} aria-label="Added" /> : <span aria-label="Not added">+</span>}</span>{item.label}</li>)}</ul><button className="xp-button mt-5 w-full" onClick={() => setEdit(true)}>{complete === 3 ? "Update my details" : "Complete my details"}<Pencil size={15} /></button></ExperienceCard>
      <ExperienceCard className="!border-amber-300/20"><QrCode size={28} className="text-amber-300" /><h2 className="mt-4 text-lg font-semibold text-white">Ready for check-in?</h2><p className="mt-2 text-sm leading-6 text-neutral-400">Open your private event pass when you arrive. The QR code refreshes automatically so you can check in with staff.</p><button className="xp-button xp-primary mt-5 w-full" onClick={() => window.dispatchEvent(new Event("aclcxp:open-student-qr"))}><QrCode size={17} /> Open event pass</button><Link to="/events?view=reservations" className="xp-text-link mt-2">View my reservations <ArrowUpRight size={15} /></Link></ExperienceCard>
      </div>
    </div>
    {summary.isPending ? <Loading /> : summary.isError ? <Notice error={summary.error} retry={() => void summary.refetch()} /> : <><MilestoneProgress data={summary.data} />{summary.data.settings.support_email && <ExperienceCard><h2 className="text-sm font-semibold text-white">Need a hand?</h2><p className="mt-2 text-xs leading-5 text-neutral-400">Student support can help with your account or campus records.</p><a className="xp-text-link" href={`mailto:${summary.data.settings.support_email}`}>Contact student support <ArrowUpRight size={15} /></a></ExperienceCard>}</>}
    {edit && <Editor title="Contact information" eyebrow="My student profile" description="Update your contact details and tell us a little about yourself. Save changes when you are ready." path={`/users/${user.id}/`} method="patch" initial={{ ...user }} fields={[
      { name: "phone_number", label: "Phone number" }, { name: "contact_person", label: "Emergency contact name" }, { name: "contact_number", label: "Emergency contact number" }, { name: "bio", label: "About you", type: "textarea" }, { name: "profile_photo", label: "Profile photo URL" },
    ]} onClose={() => { setEdit(false); void refreshUser(); }} />}
  </ExperienceFrame>;
}
