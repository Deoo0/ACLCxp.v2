import { ResourcePage, Badge } from "../../components/admin/ConsoleUI";
export default function AuditLogsPage() {
  return (
    <ResourcePage
      title="Audit trail"
      description="Read-only history of authenticated write requests and their outcomes. Passwords and QR credentials are excluded."
      endpoint="/admin/audit/"
      columns={[
        {
          key: "created_at",
          label: "Time",
          render: (r) => new Date(String(r.created_at)).toLocaleString(),
        },
        { key: "user_email", label: "Actor" },
        { key: "user_role", label: "Role" },
        { key: "description", label: "Action" },
        {
          key: "status",
          label: "Outcome",
          render: (r) => <Badge value={r.status} />,
        },
      ]}
    />
  );
}
