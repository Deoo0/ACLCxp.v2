import { useApi } from "../../services/queries";
import { input, button, Notice } from "./ConsoleUI";

export type Filters = Record<string, string>;
export type AccountOptions = {
  programs: string[];
  year_levels: number[];
  houses: { id: number; name: string }[];
  roles: { value: string; label: string; count: number }[];
};
export function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block min-w-36 flex-1 space-y-2 text-xs text-neutral-400">
      <span>{label}</span>
      <select
        className={input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export function AccountFilters({
  values,
  onChange,
  attendance = false,
}: {
  values: Filters;
  onChange: (value: Filters) => void;
  attendance?: boolean;
}) {
  const query = useApi<AccountOptions>("/admin/users/filter-options/");
  const update = (key: string, value: string) =>
    onChange({ ...values, [key]: value });
  return (
    <div className="space-y-3">
      {query.isError && (
        <Notice error={query.error} retry={() => void query.refetch()} />
      )}
      <div className="flex flex-wrap items-end gap-3">
        <SelectFilter
          label="House"
          value={values.house || ""}
          onChange={(v) => update("house", v)}
          options={[
            { value: "", label: "All houses" },
            ...(!attendance
              ? [{ value: "unassigned", label: "Unassigned" }]
              : []),
            ...(query.data?.houses.map((h) => ({
              value: String(h.id),
              label: h.name,
            })) || []),
          ]}
        />
        <SelectFilter
          label="Program"
          value={values.program || ""}
          onChange={(v) => update("program", v)}
          options={[
            { value: "", label: "All programs" },
            ...(query.data?.programs.map((p) => ({ value: p, label: p })) ||
              []),
          ]}
        />
        <SelectFilter
          label="Year level"
          value={values.year_level || ""}
          onChange={(v) => update("year_level", v)}
          options={[
            { value: "", label: "All year levels" },
            ...(query.data?.year_levels.map((y) => ({
              value: String(y),
              label: `Year ${y}`,
            })) || []),
          ]}
        />
        {!attendance && (
          <SelectFilter
            label="Role"
            value={values.role || ""}
            onChange={(v) => update("role", v)}
            options={[
              { value: "", label: "All roles" },
              ...(query.data?.roles || []),
            ]}
          />
        )}
        <SelectFilter
          label={attendance ? "Attendance status" : "Account status"}
          value={values[attendance ? "is_valid" : "is_active"] || ""}
          onChange={(v) => update(attendance ? "is_valid" : "is_active", v)}
          options={[
            { value: "", label: "All statuses" },
            { value: "true", label: attendance ? "Valid" : "Enabled" },
            { value: "false", label: attendance ? "Voided" : "Disabled" },
          ]}
        />
        <button className={button} onClick={() => onChange({})}>
          Clear filters
        </button>
      </div>
      {attendance && (
        <p className="text-xs text-neutral-500">
          House, program and year level use the student's current profile.
        </p>
      )}
    </div>
  );
}
export function ArchiveFilters({
  archive,
  year,
  onChange,
}: {
  archive: string;
  year: string;
  onChange: (archive: string, year: string) => void;
}) {
  const query = useApi<{ years: number[] }>("/events/filter-options/");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <SelectFilter
          label="Event records"
          value={archive}
          onChange={(v) => onChange(v, year)}
          options={[
            { value: "active", label: "Current workspace" },
            { value: "archived", label: "Archived events" },
            { value: "all", label: "All records" },
          ]}
        />
        <SelectFilter
          label="Event year"
          value={year}
          onChange={(v) => onChange(archive, v)}
          options={[
            { value: "", label: "All years" },
            ...(query.data?.years.map((y) => ({
              value: String(y),
              label: String(y),
            })) || []),
          ]}
        />
      </div>
      {query.isError && (
        <Notice error={query.error} retry={() => void query.refetch()} />
      )}
    </div>
  );
}
