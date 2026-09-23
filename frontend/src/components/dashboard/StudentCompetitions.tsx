import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, MapPin, Shield, Swords, Trophy } from "lucide-react";
import { useApi, type PageData } from "../../services/queries";
import { Loading, Notice, button } from "../admin/ConsoleUI";

type House = { id: number; name: string; color_code: string; logo_url: string };
type Match = { id: number; label: string; scheduled_at: string | null; winner_side: string; winner_label: string; house_one: House | null; house_two: House | null; team_one: string; team_two: string; team_one_name: string; team_two_name: string };
type Result = { id: number; house: House | null; participant: string; team_name: string; rank: number | null; score: string | null; notes: string };
type Competition = { id: number; title: string; category_name: string; venue: string; event_date: string; matches: Match[]; results: Result[] };
const color = (house: House | null) => /^#[\da-f]{6}$/i.test(house?.color_code || '') ? house!.color_code : '#52677b';
const date = (value: string) => new Date(value).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' });

function Crest({ house, compact = false }: { house: House | null; compact?: boolean }) {
  const [failed, setFailed] = useState('');
  return house?.logo_url && failed !== house.logo_url
    ? <img src={house.logo_url} alt={`${house.name} logo`} loading="lazy" onError={() => setFailed(house.logo_url)} className={`${compact ? 'h-14 w-14 sm:h-16 sm:w-16' : 'h-20 w-20 sm:h-28 sm:w-28'} object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]`} />
    : <Shield aria-label={house?.name || 'Team'} className={`${compact ? 'h-14 w-14' : 'h-20 w-20 sm:h-28 sm:w-28'} text-white/65`} strokeWidth={1} />;
}

function MatchCard({ match, compact }: { match: Match; compact: boolean }) {
  return <div className="overflow-hidden rounded-xl border border-white/10 bg-[#080e12]">
    <div className="relative grid grid-cols-2 isolate">
      <div aria-hidden="true" className="absolute inset-y-0 left-0 -z-10 w-[55%]" style={{ background: `linear-gradient(145deg, ${color(match.house_one)}cc, ${color(match.house_one)}22)`, clipPath: 'polygon(0 0,100% 0,83% 100%,0 100%)' }} />
      <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 w-[55%]" style={{ background: `linear-gradient(220deg, ${color(match.house_two)}cc, ${color(match.house_two)}22)`, clipPath: 'polygon(17% 0,100% 0,100% 100%,0 100%)' }} />
      <p className="absolute left-1/2 top-0 z-10 max-w-[80%] -translate-x-1/2 truncate bg-[#080e12] px-5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white" style={{ clipPath: 'polygon(0 0,100% 0,92% 100%,8% 100%)' }}>{match.label}</p>
      {[{ house: match.house_one, team: match.team_one_name, fallback: match.team_one }, { house: match.house_two, team: match.team_two_name, fallback: match.team_two }].map((side, index) => <div key={index} className={`flex min-w-0 flex-col items-center text-center ${compact ? 'px-5 pb-5 pt-11' : 'px-7 pb-6 pt-12 sm:px-10'}`}>
        <Crest house={side.house} compact={compact} />{match.winner_side === (index === 0 ? "ONE" : "TWO") && <span className="mt-2 rounded bg-yellow-300 px-2 py-1 text-[9px] font-black uppercase text-black">Match winner</span>}
        <p className={`mt-3 w-full break-words font-black uppercase leading-tight text-white ${compact ? 'text-sm' : 'text-base sm:text-xl'}`}>{side.team || side.house?.name || side.fallback}</p>
        {side.team && side.house && <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">House {side.house.name}</p>}
      </div>)}
      <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#080e12] text-sm font-black italic text-yellow-300 sm:h-11 sm:w-11 sm:text-lg">VS</span>
    </div>
    <p className="flex items-center justify-center gap-2 border-t border-white/10 px-3 py-3 text-[11px] text-neutral-400"><CalendarDays className="h-3.5 w-3.5 text-amber-300" /><span>{match.winner_side ? `Winner: ${match.winner_label}` : match.scheduled_at ? `${date(match.scheduled_at)} PHT` : "Schedule to be determined"}</span></p>
  </div>;
}

export default function StudentCompetitions({ compact = false }: { compact?: boolean }) {
  const [tab, setTab] = useState<'matches' | 'match-results' | 'results'>('matches');
  const [page, setPage] = useState(1);
  const size = compact ? 2 : 4;
  const query = useApi<PageData<Competition>>(`/competitions/?tab=${tab}&page=${page}&page_size=${size}`);
  return <section id="competitions" className={`scroll-mt-24 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#111c22] via-neutral-950 to-neutral-950 ${compact ? 'p-5 sm:p-6' : 'p-5 sm:p-8'}`}>
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-amber-300"><Swords className="h-4 w-4" />{compact ? 'Campus face-offs' : 'The competition board'}</p><h2 className={`mt-2 font-black uppercase tracking-tight text-white ${compact ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>{compact ? 'Next up. Game on.' : 'House pride. Head to head.'}</h2><p className="mt-2 text-xs leading-5 text-neutral-400">{compact ? 'The latest matchups and podium finishes around campus.' : 'Follow the fixtures, back your house, and celebrate the latest event champions.'}</p></div>
      {compact && <Link to="/stats#competitions" className="flex min-h-10 items-center gap-2 text-xs font-semibold text-amber-300">Competition board<ArrowUpRight className="h-4 w-4" /></Link>}
    </header>
    <div className="mt-5 flex flex-wrap gap-2" aria-label="Competition view">{(['matches', 'match-results', 'results'] as const).map(key => <button key={key} aria-pressed={tab === key} onClick={() => { setTab(key); setPage(1); }} className={`min-h-10 rounded-lg px-4 py-2 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-amber-300 ${tab === key ? 'bg-amber-300 text-black' : 'border border-white/10 text-neutral-400 hover:bg-white/5'}`}>{key === 'matches' ? 'Bracket matches' : key === 'match-results' ? 'Match winners' : 'Final placements'}</button>)}</div>
    <div className="mt-6" aria-live="polite">
      {query.isPending ? <Loading /> : query.isError ? <Notice error={query.error} retry={() => void query.refetch()} /> : !query.data.data.length ? <div className="rounded-xl border border-dashed border-white/15 py-10 text-center"><Trophy className="mx-auto h-7 w-7 text-amber-300/70" /><p className="mt-3 text-sm font-semibold text-white">{tab === 'matches' ? 'The next rivalry is taking shape' : tab === 'match-results' ? 'No match winners announced yet' : 'The podium is waiting'}</p><p className="mt-2 px-4 text-xs text-neutral-500">{tab !== 'results' ? 'Published bracket matches and recorded winners will appear here.' : 'Verified event results will appear here once announced.'}</p></div> : <div className={`grid items-start gap-6 ${compact ? 'lg:grid-cols-2' : 'xl:grid-cols-2'}`}>
        {query.data.data.map(event => <article key={event.id} className="min-w-0">
          <div className="mb-3"><p className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80">{event.category_name}</p><h3 className="mt-1 text-base font-bold text-white">{event.title}</h3><p className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500"><MapPin className="h-3 w-3 shrink-0" />{event.venue}</p></div>
          <div className="space-y-3">{tab !== 'results' ? event.matches.slice(0, compact ? 2 : undefined).map(match => <MatchCard key={match.id} match={match} compact={compact} />) : event.results.slice(0, compact ? 3 : undefined).map(result => <div key={result.id} className={`relative flex items-center gap-3 overflow-hidden rounded-xl border p-4 ${result.rank === 1 ? 'border-amber-300/30 bg-amber-300/[.06]' : 'border-white/10 bg-white/[.025]'}`}>
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: color(result.house) }} />
            <span className={`w-8 shrink-0 text-xl font-black italic ${result.rank === 1 ? 'text-amber-300' : 'text-neutral-500'}`}>{result.rank === null ? '—' : `#${result.rank}`}</span><Crest house={result.house} compact />
            <div className="min-w-0 flex-1">{result.rank === 1 && <p className="mb-1 text-[9px] font-bold uppercase tracking-[.15em] text-amber-300">Event champion</p>}<p className="break-words text-sm font-bold uppercase text-white">{result.team_name || result.house?.name || result.participant}</p>{result.team_name && result.house && <p className="mt-1 text-[10px] text-neutral-400">House {result.house.name}</p>}</div>
            {result.score !== null && <div className="shrink-0 text-right"><p className="text-lg font-black text-white">{Number(result.score).toLocaleString()}</p><p className="text-[9px] uppercase text-neutral-500">Score</p></div>}
          </div>)}</div>
          {compact && (tab !== 'results' ? event.matches.length > 2 : event.results.length > 3) && <Link to="/stats#competitions" className="mt-3 inline-block text-xs text-amber-300">See all {tab !== 'results' ? 'matchups' : 'placements'} →</Link>}
        </article>)}
      </div>}
    </div>
    {query.data && query.data.count > size && (compact ? <Link to="/stats#competitions" className="mt-6 inline-flex text-xs font-semibold text-amber-300">More events on the competition board →</Link> : <div className="mt-6 flex items-center justify-center gap-4"><button className={button} disabled={!query.data.previous} onClick={() => setPage(page - 1)}>Previous</button><span className="text-xs text-neutral-400">{page} / {Math.ceil(query.data.count / size)}</span><button className={button} disabled={!query.data.next} onClick={() => setPage(page + 1)}>Next</button></div>)}
  </section>;
}
