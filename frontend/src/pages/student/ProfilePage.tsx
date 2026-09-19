import { useState } from "react";
import { QrCode, UserRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { StudentFrame } from "../../components/dashboard/LivePortal";
import {
  Panel,
  button,
  primary,
  Editor,
} from "../../components/admin/ConsoleUI";
import { useApi } from "../../services/queries";
import type { StudentSummary } from "../../components/dashboard/LivePortal";
export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [edit, setEdit] = useState(false);
  const summary = useApi<StudentSummary>("/portal/summary/");
  if (!user) return null;
  return (
    <StudentFrame>
      <header>
        <p className="text-sm text-amber-300">Your campus identity</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">My profile</h1>
      </header>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
              {user.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-8 w-8" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {user.full_name}
              </h2>
              <p className="mt-1 font-mono text-sm text-neutral-500">
                {user.student_id}
              </p>
            </div>
          </div>
          <dl className="mt-6 space-y-4">
            {[
              ["Email", user.email],
              ["Program", user.program],
              ["Year", user.year_level],
              ["House", user.house_name || "Not assigned"],
            ].map(([label, value]) => (
              <div
                className="flex justify-between gap-4 border-b border-white/5 pb-3"
                key={label}
              >
                <dt className="text-sm text-neutral-500">{label}</dt>
                <dd className="break-all text-right text-sm text-neutral-200">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <button className={`${button} mt-5`} onClick={() => setEdit(true)}>
            Edit contact information
          </button>
          <p className="mt-4 text-xs leading-5 text-neutral-500">
            Contact your school administrator to correct your identity, house or
            academic details.
          </p>
        </Panel>
        <Panel>
          <QrCode className="h-7 w-7 text-amber-400" />
          <h2 className="mt-5 text-lg font-semibold text-white">
            Your event pass
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Open your pass when you arrive at a registered event. The code is
            private and refreshes automatically.
          </p>
          <button
            className={`${primary} mt-5`}
            onClick={() =>
              window.dispatchEvent(new Event("aclcxp:open-student-qr"))
            }
          >
            Open event pass
          </button>
          {summary.data?.settings.support_email && (
            <p className="mt-6 text-sm text-neutral-400">
              Need help?{" "}
              <a
                className="text-amber-300"
                href={`mailto:${summary.data.settings.support_email}`}
              >
                Contact student support
              </a>
            </p>
          )}
        </Panel>
      </div>
      {edit && (
        <Editor
          title="Contact information"
          path={`/users/${user.id}/`}
          method="patch"
          initial={{ ...user }}
          fields={[
            { name: "phone_number", label: "Phone number" },
            { name: "contact_person", label: "Emergency contact name" },
            { name: "contact_number", label: "Emergency contact number" },
            { name: "bio", label: "About you", type: "textarea" },
            { name: "profile_photo", label: "Profile photo URL" },
          ]}
          onClose={() => {
            setEdit(false);
            void refreshUser();
          }}
        />
      )}
    </StudentFrame>
  );
}
