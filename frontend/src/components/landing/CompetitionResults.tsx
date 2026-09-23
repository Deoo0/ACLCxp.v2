import { useState } from "react";
import { CalendarDays, MapPin, Trophy, Swords } from "lucide-react";
import { useApi, type PageData } from "../../services/queries";
import { Loading, Notice } from "../admin/ConsoleUI";

type Competition = {
  id: number; title: string; category_name: string; event_date: string;
  venue: string; banner_image: string;
  matches: { id: number; label: string; team_one: string; team_two: string; scheduled_at: string | null; winner_side: string; winner_label: string }[];
  results: { id: number; participant: string; rank: number | null; score: string | null; notes: string; photo_url: string }[];
};
const dateLabel = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

export default function CompetitionResults() {
  const [tab, setTab] = useState<"results" | "matches" | "match-results">("results");
  const [page, setPage] = useState(1);
  const query = useApi<PageData<Competition>>(`/competitions/?tab=${tab}&page=${page}&page_size=4`);
  return <section id="results" className="scroll-mt-24 border-y border-white/10 bg-neutral-950 px-5 py-16 text-white sm:py-24">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-300">The campus competitive stage</p><h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-5xl">Matchups & results<span className="text-yellow-300">.</span></h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-neutral-400">See who’s facing off next and celebrate the teams making their mark.</p></div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-white/15 p-1" aria-label="Competition view">
          {([['results', 'Final placements'], ['matches', 'Bracket matches'], ['match-results', 'Match winners']] as const).map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} onClick={() => { setTab(key); setPage(1); }} className={`rounded-md px-4 py-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-yellow-300 ${tab === key ? 'bg-yellow-300 text-black' : 'text-neutral-400 hover:bg-white/10 hover:text-white'}`}>{label}</button>)}
        </div>
      </div>
      <div className="mt-9" aria-live="polite">
        {query.isPending ? <Loading /> : query.isError ? <Notice error={query.error} retry={() => void query.refetch()} /> : !query.data.data.length ? <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-6 py-14 text-center"><Trophy className="mx-auto text-yellow-300" size={32} /><h3 className="mt-4 text-lg font-bold">{tab === 'results' ? 'The next campus champions start here' : tab === 'match-results' ? 'Match winners will appear here' : 'The next face-off is on its way'}</h3><p className="mt-2 text-sm text-neutral-400">{tab === 'results' ? 'Verified event results will appear here once they are published.' : 'Check back for announced teams, match schedules, and venues.'}</p></div> : <div className="grid items-start gap-6 md:grid-cols-2">
          {query.data.data.map(event => <article key={event.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#10191d]">
            <div className="relative flex min-h-44 flex-col justify-end overflow-hidden bg-gradient-to-br from-slate-800 via-neutral-900 to-black p-6">
              {event.banner_image && <img src={event.banner_image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
              <div className="relative"><span className="inline-flex items-center gap-2 bg-yellow-300 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-black">{tab === 'results' ? <Trophy size={12} /> : <Swords size={12} />}{event.category_name} · {tab === 'results' ? 'Official results' : tab === 'match-results' ? 'Match completed' : 'Bracket match'}</span><h3 className="mt-3 text-2xl font-black uppercase leading-tight">{event.title}</h3></div>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-white/10 px-6 py-4 text-xs text-neutral-300"><span className="flex items-center gap-2"><CalendarDays size={14} className="text-yellow-300" />{dateLabel(event.event_date)}</span><span className="flex items-center gap-2"><MapPin size={14} className="text-yellow-300" />{event.venue}</span></div>
            <div className="space-y-2 p-4">
              {tab !== 'results' ? event.matches.map(match => <div key={match.id} className="border border-white/10 bg-white/[0.03] p-3"><div className="mb-3 flex flex-wrap justify-between gap-2 text-[11px] text-neutral-400"><span>{match.label}</span><span>{match.winner_side ? `Winner: ${match.winner_label}` : match.scheduled_at ? `${new Date(match.scheduled_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' })} PHT` : 'Schedule TBD'}</span></div><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center text-sm font-extrabold uppercase"><span className="break-words">{match.team_one}</span><span className="text-yellow-300">VS</span><span className="break-words">{match.team_two}</span></div></div>) : event.results.map(result => <div key={result.id} className={`border p-4 ${result.rank === 1 ? 'border-yellow-300/30 bg-yellow-300/5' : 'border-white/10 bg-white/[0.02]'}`}><div className="flex items-center gap-4"><span className={`text-xl font-black ${result.rank === 1 ? 'text-yellow-300' : 'text-neutral-500'}`}>{result.rank == null ? '—' : `#${result.rank}`}</span><div className="min-w-0 flex-1"><p className="break-words text-sm font-bold uppercase">{result.participant}</p>{result.rank === 1 && <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-yellow-300">First place</p>}</div>{result.score !== null && <div className="text-right"><p className="text-lg font-black">{Number(result.score).toLocaleString()}</p><p className="text-[10px] uppercase text-neutral-500">Score</p></div>}</div>{result.notes && <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-neutral-400">{result.notes}</p>}</div>)}
            </div>
          </article>)}
        </div>}
      </div>
      {query.data && query.data.count > 4 && <div className="mt-6 flex items-center justify-center gap-5 text-sm"><button disabled={!query.data.previous} onClick={() => setPage(page - 1)} className="rounded border border-white/20 px-4 py-2 disabled:opacity-30">Previous</button><span className="text-neutral-400">Page {page} of {Math.ceil(query.data.count / 4)}</span><button disabled={!query.data.next} onClick={() => setPage(page + 1)} className="rounded border border-white/20 px-4 py-2 disabled:opacity-30">Next</button></div>}
    </div>
  </section>;
}
