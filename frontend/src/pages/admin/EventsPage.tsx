import { useState } from "react";
import { ArchiveFilters } from "../../components/admin/Filters";
import {
  ResourcePage,
  Editor,
  Records,
  button,
  primary,
  Badge,
  Panel,
} from "../../components/admin/ConsoleUI";
import type { Field } from "../../components/admin/ConsoleUI";
import { useApi } from "../../services/queries";
import type { PageData, Row } from "../../services/queries";
export default function EventsPage() {
  const [archive, setArchive] = useState("active");
  const [year, setYear] = useState("");
  const [archiving, setArchiving] = useState<Row | "year" | null>(null);
  const [tab, setTab] = useState("events");
  const [status, setStatus] = useState<Row | null>(null);
  const [roster, setRoster] = useState<Row | null>(null);
  const houses = useApi<PageData>("/admin/houses/?page_size=100");
  const fields: Field[] = [
    { name: "title", label: "Event title", required: true },
    {
      name: "slug",
      label: "URL name",
      required: true,
      hint: "Unique lowercase name with hyphens, such as campus-chess-2027.",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: true,
    },
    {
      name: "category",
      label: "Category",
      type: "lookup",
      endpoint: "/events/categories/",
      required: true,
    },
    {
      name: "event_date",
      label: "Event date (UTC)",
      type: "date",
      required: true,
    },
    {
      name: "start_time",
      label: "Start time (UTC)",
      type: "time",
      required: true,
    },
    { name: "end_time", label: "End time (UTC)", type: "time", required: true },
    { name: "venue", label: "Venue", required: true },
    {
      name: "capacity",
      label: "Capacity",
      type: "number",
      min: 1,
      required: true,
    },
    { name: "allow_waitlist", label: "Allow waitlist", type: "checkbox" },
    {
      name: "registration_opens_at",
      label: "Registration opens (your local time)",
      type: "datetime-local",
    },
    {
      name: "registration_closes_at",
      label: "Registration closes (your local time)",
      type: "datetime-local",
    },
    {
      name: "visibility",
      label: "Audience",
      type: "select",
      required: true,
      options: [
        { label: "All students", value: "PUBLIC" },
        { label: "Selected programs", value: "PROGRAM" },
        { label: "Selected houses", value: "HOUSE" },
      ],
    },
    {
      name: "allowed_programs",
      label: "Eligible program codes",
      type: "list",
      hint: "Comma-separated codes (BSIT, BSCS). Leave blank for all programs.",
    },
    {
      name: "allowed_houses",
      label: "Eligible houses",
      type: "multi",
      options: houses.data?.data.map((r) => ({
        label: String(r.name),
        value: r.id,
      })),
      hint: "Leave empty for all houses. Hold Ctrl/Command to select multiple.",
    },
    {
      name: "allowed_year_levels",
      label: "Eligible year levels",
      type: "multi",
      options: [1, 2, 3, 4, 5, 6].map((value) => ({
        label: `Year ${value}`,
        value,
      })),
      hint: "Leave empty for all year levels.",
    },
    {
      name: "participation_points",
      label: "Participation points",
      type: "number",
      min: 0,
      required: true,
    },
    {
      name: "first_place_points",
      label: "First place points",
      type: "number",
      min: 0,
      required: true,
    },
    {
      name: "second_place_points",
      label: "Second place points",
      type: "number",
      min: 0,
      required: true,
    },
    {
      name: "third_place_points",
      label: "Third place points",
      type: "number",
      min: 0,
      required: true,
    },
    { name: "banner_image", label: "Event background photo", type: "image" },
    { name: "poster_image", label: "Event poster photo", type: "image" },
    { name: "requirements", label: "Requirements", type: "textarea" },
    { name: "rules", label: "Rules", type: "textarea" },
    { name: "prizes", label: "Prizes", type: "textarea" },
  ];
  const next: Record<string, string[]> = {
    DRAFT: ["PUBLISHED", "CANCELLED"],
    PUBLISHED: ["ONGOING", "CANCELLED"],
    ONGOING: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
  };
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          className={tab === "events" ? primary : button}
          onClick={() => setTab("events")}
        >
          Events
        </button>
        <button
          className={tab === "categories" ? primary : button}
          onClick={() => setTab("categories")}
        >
          Categories
        </button>
      </div>
      {tab === "events" ? (
        <div className="space-y-5">
          <Panel>
            <ArchiveFilters
              archive={archive}
              year={year}
              onChange={(a, y) => {
                setArchive(a);
                setYear(y);
                setRoster(null);
              }}
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                className={button}
                disabled={!year || archive === "archived"}
                onClick={() => setArchiving("year")}
              >
                Archive completed events for {year || "a year"}
              </button>
              <p className="text-xs text-neutral-500">
                History and points stay intact. Select a year to organize past
                events.
              </p>
            </div>
          </Panel>
          <ResourcePage
            title="Events"
            description="Create drafts, publish activities and manage their lifecycle. Published events appear on eligible students' event pages."
            endpoint="/events/"
            listEndpoint={`/events/?archive=${archive}&year=${year}`}
            fields={fields}
            defaults={{
              capacity: 100,
              allow_waitlist: true,
              visibility: "PUBLIC",
              participation_points: 5,
              first_place_points: 50,
              second_place_points: 40,
              third_place_points: 30,
            }}
            canCreate
            canEdit
            canDelete
            columns={[
              { key: "title", label: "Event" },
              { key: "event_date", label: "Date" },
              {
                key: "archived_at",
                label: "Workspace",
                render: (r) => (
                  <Badge value={r.archived_at ? "ARCHIVED" : "CURRENT"} />
                ),
              },
              { key: "venue", label: "Venue" },
              {
                key: "status",
                label: "Status",
                render: (r) => <Badge value={r.status} />,
              },
              {
                key: "current_registered",
                label: "Seats",
                render: (r) => `${r.current_registered} / ${r.capacity}`,
              },
            ]}
            extraActions={(r) => (
              <>
                {(r.archived_at ||
                  ["COMPLETED", "CANCELLED"].includes(String(r.status))) && (
                  <button className={button} onClick={() => setArchiving(r)}>
                    {r.archived_at ? "Restore" : "Archive"}
                  </button>
                )}
                {(next[String(r.status)] || []).length > 0 && (
                  <button className={button} onClick={() => setStatus(r)}>
                    Change status
                  </button>
                )}
                <button
                  className={button}
                  onClick={() => setRoster(roster?.id === r.id ? null : r)}
                >
                  Registrations
                </button>
              </>
            )}
          />
        </div>
      ) : (
        <ResourcePage
          title="Event categories"
          description="Organize campus activities. Deactivate a category instead of deleting one already used by events."
          endpoint="/events/categories/"
          canCreate
          canEdit
          canDelete
          defaults={{
            is_active: true,
            display_order: 0,
            color_code: "#fbbf24",
          }}
          fields={[
            { name: "name", label: "Name", required: true },
            { name: "slug", label: "URL name", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "display_order", label: "Display order", type: "number" },
            { name: "is_active", label: "Active", type: "checkbox" },
          ]}
          columns={[
            { key: "name", label: "Category" },
            { key: "slug", label: "URL name" },
            { key: "is_active", label: "Active" },
          ]}
        />
      )}
      {roster && tab === "events" && (
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">
              Registrations / {String(roster.title)}
            </h2>
            <button className={button} onClick={() => setRoster(null)}>
              Close
            </button>
          </div>
          <Records
            key={roster.id}
            endpoint={`/events/${roster.id}/registrations/`}
            columns={[
              { key: "student_id", label: "Student number" },
              { key: "student_name", label: "Student" },
              { key: "status", label: "Status" },
              { key: "waitlist_position", label: "Queue order" },
              { key: "registered_at", label: "Registered" },
            ]}
          />
        </Panel>
      )}
      {status && (
        <Editor
          title="Change event status"
          description="Starting enables attendance. Cancelling releases registrations and cannot be undone. Completing finalizes the event."
          path={`/events/${status.id}/`}
          method="patch"
          fields={[
            {
              name: "status",
              label: "Next status",
              type: "select",
              required: true,
              options: next[String(status.status)].map((value) => ({
                label: value,
                value,
              })),
            },
          ]}
          onClose={() => setStatus(null)}
        />
      )}
      {archiving && (
        <Editor
          title={
            archiving === "year"
              ? `Archive closed events from ${year}?`
              : `${archiving.archived_at ? "Restore" : "Archive"} ${archiving.title}?`
          }
          description={
            archiving === "year"
              ? "Completed and cancelled events from this calendar year move to the archive. Draft, published and ongoing events remain in the current workspace. Attendance, registrations and points are preserved."
              : "This changes where the event and its attendance reports appear. No history or points are deleted. You can restore archived events at any time."
          }
          fields={[]}
          path={
            archiving === "year"
              ? "/events/archive-year/"
              : `/events/${archiving.id}/archive/`
          }
          transform={() =>
            archiving === "year"
              ? { year: Number(year) }
              : { archived: !archiving.archived_at }
          }
          onClose={() => setArchiving(null)}
        />
      )}
    </div>
  );
}
