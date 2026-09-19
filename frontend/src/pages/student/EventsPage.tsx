import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CalendarDays,
  MapPin,
  Users,
  ArrowUpRight,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useApi, useWrite } from "../../services/queries";
import type { PageData, Row } from "../../services/queries";
import { StudentFrame } from "../../components/dashboard/LivePortal";
import {
  Panel,
  Notice,
  Loading,
  button,
  primary,
  Badge,
  input,
  Records,
} from "../../components/admin/ConsoleUI";
export default function EventsPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState("");
  const query = useApi<PageData>(
    `/events/?page=${page}&status=${status}&search=${encodeURIComponent(search)}`,
  );
  const detail = useApi<Row>(`/events/${selected?.id}/`, !!selected);
  const write = useWrite();
  const event = detail.data || selected;
  const act = async (cancel: boolean) => {
    if (!event) return;
    setError(null);
    try {
      const response = await write.mutateAsync({
        path: `/events/${event.id}/${cancel ? "cancel-registration" : "register"}/`,
        body: cancel ? { reason: "Cancelled by student" } : {},
      });
      setMessage(
        cancel
          ? "Your registration has been cancelled."
          : response.data.status === "WAITLISTED"
            ? "You joined the waitlist. Your registration updates when a place becomes available."
            : "Your registration is confirmed. Bring your event pass when you arrive.",
      );
    } catch (e) {
      setError(e);
    }
  };
  return (
    <StudentFrame>
      <header>
        <p className="text-sm text-amber-300">Campus activities</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Find your next event
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Browse eligible events, reserve a place and follow your registrations.
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <input
          className={`${input} sm:max-w-xs`}
          aria-label="Search events"
          placeholder="Search events..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className={`${input} sm:max-w-xs`}
          aria-label="Filter event status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All events</option>
          <option value="PUBLISHED">Upcoming</option>
          <option value="ONGOING">Happening now</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Notice error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {query.data.data.map((row) => (
              <button
                className="group overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60 text-left transition hover:-translate-y-0.5 hover:border-amber-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                key={row.id}
                onClick={() => {
                  setSelected(row);
                  setMessage("");
                  setError(null);
                }}
              >
                {row.poster_image ? (
                  <img
                    src={String(row.poster_image)}
                    alt=""
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center bg-gradient-to-br from-amber-400/10 via-neutral-900 to-neutral-800">
                    <CalendarDays className="h-9 w-9 text-amber-400/50" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <Badge value={row.status} />
                    <ArrowUpRight className="h-4 w-4 text-neutral-500" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-white">
                    {String(row.title)}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">
                    {String(row.description)}
                  </p>
                  <div className="mt-5 space-y-2 text-xs text-neutral-400">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-amber-400" />
                      {String(row.event_date)} /{" "}
                      {String(row.start_time).slice(0, 5)} UTC
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-amber-400" />
                      {String(row.venue)}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-400" />
                      {String(row.available_slots)} places available
                    </p>
                  </div>
                  {Boolean(row.registration_status) && (
                    <div className="mt-4">
                      <Badge value={row.registration_status} />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </section>
          {!query.data.data.length && (
            <Panel>
              <p className="py-8 text-center text-sm text-neutral-500">
                No events match your search. Published activities will appear
                here.
              </p>
            </Panel>
          )}
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>
              {query.data.count} events / Page {page}
            </span>
            <div className="flex gap-2">
              <button
                className={button}
                disabled={!query.data.previous}
                onClick={() => setPage(page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                className={button}
                disabled={!query.data.next}
                onClick={() => setPage(page + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">
          My registrations
        </h2>
        <Records
          endpoint="/events/my-registrations/"
          columns={[
            { key: "event_title", label: "Event" },
            {
              key: "status",
              label: "Status",
              render: (r) => <Badge value={r.status} />,
            },
            { key: "waitlist_position", label: "Queue order" },
            {
              key: "registered_at",
              label: "Registered",
              render: (r) =>
                new Date(String(r.registered_at)).toLocaleDateString(),
            },
          ]}
          actions={(r) => (
            <button
              className={button}
              onClick={() => {
                setSelected({ id: Number(r.event) });
                setMessage("");
                setError(null);
              }}
            >
              View event
            </button>
          )}
        />
      </section>
      <Dialog.Root
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !write.isPending) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/70 backdrop-blur" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] max-h-[90dvh] w-[calc(100%-24px)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900 p-6 text-neutral-200">
            <div className="flex justify-between gap-4">
              <Dialog.Title className="text-xl font-semibold text-white">
                {String(event?.title || "Event details")}
              </Dialog.Title>
              <Dialog.Close
                disabled={write.isPending}
                className={button}
                aria-label="Close event details"
              >
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-400">
              {String(event?.description || "Loading event details...")}
            </Dialog.Description>
            {detail.isError ? (
              <Notice
                error={detail.error}
                retry={() => void detail.refetch()}
              />
            ) : detail.isPending ? (
              <Loading />
            ) : (
              event && (
                <>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Badge value={event.status} />
                    {Boolean(event.registration_status) && (
                      <Badge value={event.registration_status} />
                    )}
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                    {[
                      ["Date", event.event_date],
                      ["Venue", event.venue],
                      ["Starts (UTC)", event.start_time],
                      ["Ends (UTC)", event.end_time],
                      ["Available places", event.available_slots],
                      ["Participation points", event.participation_points],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <dt className="text-xs text-neutral-500">
                          {String(label)}
                        </dt>
                        <dd className="mt-1 text-neutral-200">
                          {String(value ?? "-")}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {["requirements", "rules", "prizes"].map((key) =>
                    event[key] ? (
                      <section key={key} className="mt-5">
                        <h3 className="text-sm font-semibold capitalize text-neutral-200">
                          {key}
                        </h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-400">
                          {String(event[key])}
                        </p>
                      </section>
                    ) : null,
                  )}
                  {error != null && (
                    <div className="mt-4">
                      <Notice error={error} />
                    </div>
                  )}
                  {message && (
                    <p
                      role="status"
                      className="mt-4 rounded-xl bg-emerald-400/10 p-3 text-sm text-emerald-200"
                    >
                      {message}
                    </p>
                  )}
                  <div className="mt-6 flex flex-wrap gap-2">
                    {event.status === "PUBLISHED" &&
                      (!event.registration_status ||
                        event.registration_status === "CANCELLED") && (
                        <button
                          className={primary}
                          disabled={write.isPending}
                          onClick={() => void act(false)}
                        >
                          {Number(event.available_slots) > 0
                            ? "Register for event"
                            : event.allow_waitlist
                              ? "Join waitlist"
                              : "Event full"}
                        </button>
                      )}
                    {["REGISTERED", "WAITLISTED"].includes(
                      String(event.registration_status),
                    ) &&
                      event.status === "PUBLISHED" && (
                        <button
                          className={button}
                          disabled={write.isPending}
                          onClick={() => void act(true)}
                        >
                          Cancel registration
                        </button>
                      )}
                  </div>
                </>
              )
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </StudentFrame>
  );
}
