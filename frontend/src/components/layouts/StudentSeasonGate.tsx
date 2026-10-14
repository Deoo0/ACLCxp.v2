import { useEffect, useState, type ReactNode } from "react";
import { Ticket, LockKeyhole, LogOut, CalendarDays } from "lucide-react";
import { queryClient, useApi, useWrite } from "../../services/queries";
import { useAuth } from "../../context/AuthContext";
import { Loading, Notice, button, primary, input } from "../admin/ConsoleUI";

type Access = { season: { name: string; status: string; starts_on: string | null } | null; enrolled: boolean; can_access: boolean; can_redeem: boolean };
export default function StudentSeasonGate({ children }: { children: ReactNode }) {
  const query = useApi<Access>('/seasons/access/');
  const write = useWrite();
  const { logout } = useAuth();
  const [ticket, setTicket] = useState('');
  useEffect(() => {
    const lock = () => {
      queryClient.setQueryData<Access>(['/seasons/access/'], previous => previous ? { ...previous, can_access: false } : previous);
      void queryClient.invalidateQueries({ queryKey: ['/seasons/access/'] });
    };
    window.addEventListener('season:locked', lock);
    return () => window.removeEventListener('season:locked', lock);
  }, []);
  if (query.isPending) return <div className="min-h-screen bg-neutral-950"><Loading /></div>;
  if (query.isError) return <div className="min-h-screen bg-neutral-950 p-8"><Notice error={query.error} retry={() => void query.refetch()} /><button className={`${button} mt-4`} onClick={() => void logout()}>Sign out</button></div>;
  if (query.data.can_access) return <>
    {query.data.can_redeem && <details className="border-b border-amber-300/20 bg-neutral-950 px-5 py-3 text-sm text-neutral-200"><summary className="cursor-pointer">Ticket-free events are available. Activate a ticket for paid events.</summary>
      <form className="mt-3 flex max-w-xl flex-wrap gap-3" onSubmit={event => { event.preventDefault(); write.mutate({ path: '/seasons/redeem/', body: { ticket_number: ticket.trim() } }); }}>
        <label className="w-full" htmlFor="optional-season-ticket">Current-season ticket number</label><input id="optional-season-ticket" className={input} inputMode="numeric" required maxLength={12} autoComplete="off" value={ticket} onChange={event => setTicket(event.target.value)} /><button disabled={write.isPending} className={primary}>{write.isPending ? 'Activating…' : 'Activate ticket'}</button>
      </form>{write.isError && <Notice error={write.error} />}
    </details>}{children}</>;
  const { season, enrolled, can_redeem } = query.data;
  return <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-5 py-12 text-white">
    <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-gradient-to-br from-amber-300/10 to-neutral-900 p-7 sm:p-10">
      <LockKeyhole className="h-9 w-9 text-amber-300" /><p className="mt-6 text-xs font-bold uppercase tracking-widest text-amber-300">Season access</p><h1 className="mt-3 text-3xl font-bold">{season?.name || 'The next season is coming'}</h1>
      <p className="mt-4 text-sm leading-6 text-neutral-400">{!season || season.status === 'DRAFT' ? 'Student access is not open yet. Please wait for the school to open registration or start the season.' : season.status === 'CLOSED' ? 'This season has ended. Your account stays available for future school events.' : enrolled ? 'Your ticket is activated. Your student dashboard will unlock when the administrator starts this season.' : 'No eligible ticket-free events are available to your account yet. For ticketed events, enter an unused current-season ticket. Contact the SSC if your school record needs updating.'}</p>
      {season?.starts_on && <p className="mt-4 flex items-center gap-2 text-xs text-neutral-400"><CalendarDays className="h-4 w-4" />Planned start: {season.starts_on}</p>}
      {can_redeem && <form className="mt-6 space-y-3" onSubmit={event => { event.preventDefault(); write.mutate({ path: '/seasons/redeem/', body: { ticket_number: ticket.trim() } }); }}><label className="block text-sm" htmlFor="season-ticket">Current-season ticket number</label><input id="season-ticket" className={input} inputMode="numeric" required maxLength={12} autoComplete="off" value={ticket} onChange={event => setTicket(event.target.value)} /><button disabled={write.isPending} className={`${primary} w-full`}><Ticket className="h-4 w-4" />{write.isPending ? 'Activating…' : 'Activate season access'}</button></form>}
      {write.isError && <div className="mt-4"><Notice error={write.error} /></div>}
      <button className={`${button} mt-6 w-full`} onClick={() => void logout()}><LogOut className="h-4 w-4" />Sign out</button>
    </section>
  </main>;
}
