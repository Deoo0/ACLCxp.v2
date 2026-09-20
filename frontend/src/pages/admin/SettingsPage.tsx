import { useState } from "react";
import { Editor, Records, PageHeading, button, type Field } from "../../components/admin/ConsoleUI";
import type { Row } from "../../services/queries";

function settingField(row: Row): Field {
  const fields: Record<string, Field> = {
    announcement: { name: 'value', label: 'Dashboard announcement', type: 'textarea', hint: 'Shown on student dashboards. Leave blank to hide the announcement.' },
    support_email: { name: 'value', label: 'Support email address', type: 'email', placeholder: 'support@example.com', hint: 'The contact address students can use for assistance.' },
    merit_milestone: { name: 'value', label: 'Points per milestone', type: 'number', min: 1, max: 1000000, required: true, hint: 'The number of points between each student dashboard milestone.' },
    registration_enabled: { name: 'value', label: 'Account registration', type: 'select', required: true, options: [{ label: 'Enabled — allow account registration', value: 'true' }, { label: 'Disabled — pause account registration', value: 'false' }] },
  };
  return fields[String(row.key)] || { name: 'value', label: 'Setting value', type: 'textarea' };
}

export default function SettingsPage() {
  const [editing, setEditing] = useState<Row | null>(null);
  return <div className="space-y-6">
    <PageHeading title="Portal settings" description="Manage announcements, support contact details, milestones, and registration. Updates appear when student pages refresh." />
    <Records endpoint="/admin/settings/" columns={[{ key: 'key', label: 'Setting' }, { key: 'description', label: 'Purpose' }, { key: 'value', label: 'Current value' }, { key: 'updated_at', label: 'Updated' }]} actions={row => <button className={button} onClick={() => setEditing(row)}>Edit</button>} />
    {editing && <Editor title={`Edit ${settingField(editing).label.toLowerCase()}`} description={String(editing.description || 'Update this setting for the student portal.')} path={`/admin/settings/${editing.id}/`} method="patch" initial={editing} fields={[settingField(editing)]} transform={data => ({ value: String(data.value ?? '') })} onClose={() => setEditing(null)} />}
  </div>;
}
