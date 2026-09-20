import { ResourcePage } from "../../components/admin/ConsoleUI";
import HouseLogo from "../../components/ui/HouseLogo";
export default function HousesPage() {
  return (
    <ResourcePage
      title="Houses"
      description="Manage house identities. Points and member totals come from actual student records and the points ledger."
      endpoint="/admin/houses/"
      canCreate
      canEdit
      canDelete
      deleteDescription="Permanently delete this house. Reassign its students and remove event audience restrictions first. Houses with points, results, or standings history must be deactivated instead."
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
        { name: "logo_url", label: "House logo", type: "image", aspectRatio: 1 },
        { name: "is_active", label: "House active", type: "checkbox" },
      ]}
      columns={[
        {
          key: "name",
          label: "House",
          render: (r) => (
            <span className="flex items-center gap-2">
              <HouseLogo name={String(r.name)} src={String(r.logo_url || "")} color={String(r.color_code)} />
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
