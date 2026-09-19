import { ResourcePage } from "../../components/admin/ConsoleUI";
export default function SettingsPage() {
  return (
    <ResourcePage
      title="Portal settings"
      description="These settings control the student dashboard and event registration. Updates appear when student pages refresh."
      endpoint="/admin/settings/"
      canEdit
      fields={[
        {
          name: "value",
          label: "Setting value",
          type: "textarea",
          hint: "Registration: true/false. Milestone: a positive whole number. Support: an email address.",
        },
      ]}
      columns={[
        { key: "key", label: "Setting" },
        { key: "description", label: "Purpose" },
        { key: "value", label: "Current value" },
        { key: "updated_at", label: "Updated" },
      ]}
    />
  );
}
