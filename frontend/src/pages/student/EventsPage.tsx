import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CalendarDays,
  MapPin,
  Users,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useApi, useWrite } from "../../services/queries";
import type { PageData, Row } from "../../services/queries";
import EventDetails from "../../components/dashboard/EventDetails";
import { StudentFrame } from "../../components/dashboard/LivePortal";
import {
  Panel,
  Notice,
  Loading,
  button,
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
            : "Your attendance reservation is confirmed. This is not a player or contestant sign-up. Bring your student QR pass for check-in.",
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
          Browse events and register to attend when required. Open-attendance events only need your student QR pass at check-in.
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
                      {row.registration_required === false ? "Open attendance · No registration needed" : `${String(row.available_slots)} attendance places available`}
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
          My attendance reservations
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
          <EventDetails
            event={event}
            loading={detail.isPending}
            loadError={detail.isError ? detail.error : null}
            retry={() => void detail.refetch()}
            pending={write.isPending}
            error={error}
            message={message}
            onAction={(cancel) => void act(cancel)}
          />
        </Dialog.Portal>
      </Dialog.Root>
    </StudentFrame>
  );
}
