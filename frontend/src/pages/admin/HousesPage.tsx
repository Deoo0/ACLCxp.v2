import { ResourcePage } from "../../components/admin/ConsoleUI";
export default function HousesPage() {
  return (
    <ResourcePage
      title="Houses"
      description="Manage house identities. Points and member totals come from actual student records and the points ledger."
      endpoint="/admin/houses/"
      canCreate
      canEdit
      defaults={{ is_active: true, color_code: "#fbbf24" }}
      fields={[
        { name: "name", label: "House name", required: true },
        {
          name: "color_code",
          label: "House color",
          required: true,
          hint: "Six-digit hex color, such as #fbbf24",
        },
        { name: "motto", label: "Motto" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "logo_url", label: "Logo URL" },
        { name: "is_active", label: "House active", type: "checkbox" },
      ]}
      columns={[
        {
          key: "name",
          label: "House",
          render: (r) => (
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: String(r.color_code) }}
              />
              {String(r.name)}
            </span>
          ),
        },
        { key: "motto", label: "Motto" },
        { key: "member_count", label: "Students" },
        { key: "total_points", label: "Points" },
        { key: "is_active", label: "Active" },
      ]}
    />
  );
}
