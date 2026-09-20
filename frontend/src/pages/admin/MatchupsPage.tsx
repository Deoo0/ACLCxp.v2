import { useState } from "react";
import { Link } from "react-router-dom";
import { Swords, Trophy, ArrowUpRight } from "lucide-react";
import { ResourcePage, Editor, Panel, Badge, button, primary, type Field } from "../../components/admin/ConsoleUI";
import type { Row } from "../../services/queries";

const eventField: Field = { name: "event", label: "Event", type: "lookup", endpoint: "/events/", optionLabel: "title", required: true };
const houseField = (name: string, label: string): Field => ({ name, label, type: "lookup", endpoint: "/admin/houses/", required: true });
const resultFields: Field[] = [eventField, houseField("house", "Competing house"),
  { name: "team_name", label: "Team name (optional)", hint: "Leave blank to display just the house name." },
  { name: "rank", label: "Placement", type: "select", required: true, options: [{ label: "1st place", value: 1 }, { label: "2nd place", value: 2 }, { label: "3rd place", value: 3 }] },
  { name: "score", label: "Score (optional)", hint: "Numeric score, up to two decimal places. Leave blank if not applicable." },
  { name: "notes", label: "Public result notes", type: "textarea" },
];

export default function MatchupsPage() {
  const [tab, setTab] = useState("matches");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [correct, setCorrect] = useState<Row | null>(null);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center gap-3">
      <button className={tab === 'matches' ? primary : button} aria-pressed={tab === 'matches'} onClick={() => setTab('matches')}><Swords className="h-4 w-4" />Matchups</button>
      <button className={tab === 'results' ? primary : button} aria-pressed={tab === 'results'} onClick={() => setTab('results')}><Trophy className="h-4 w-4" />Results</button>
      <Link to="/results" className={`${button} sm:ml-auto`}>View public page<ArrowUpRight className="h-4 w-4" /></Link>
    </div>
    {tab === 'matches' ? <ResourcePage key="matches" title="Matchups & Results" description="Announce who is competing. Select two houses, optionally name their teams, and schedule the match." endpoint="/admin/matchups/" canCreate canEdit canDelete defaults={{ label: "Match 1", is_published: false }} deleteDescription="Remove this matchup announcement from the schedule. Existing event results and points are kept."
      fields={[eventField, { name: "label", label: "Match / round", required: true, hint: "For example: Match 1, Semifinal, or Championship." }, houseField("house_one", "House one"), { name: "team_one", label: "House one's team name (optional)" }, houseField("house_two", "House two"), { name: "team_two", label: "House two's team name (optional)" }, { name: "scheduled_at", label: "Match date and time (your local time)", type: "datetime-local", required: true }, { name: "is_published", label: "Publish announcement", type: "checkbox" }]}
      columns={[{ key: "event_title", label: "Event" }, { key: "label", label: "Round" }, { key: "house_one_name", label: "House one", render: row => <div><p className="font-medium text-white">{String(row.house_one_name || 'Choose a house')}</p><p className="text-xs text-neutral-400">{String(row.team_one || '')}</p></div> }, { key: "house_two_name", label: "House two", render: row => <div><p className="font-medium text-white">{String(row.house_two_name || 'Choose a house')}</p><p className="text-xs text-neutral-400">{String(row.team_two || '')}</p></div> }, { key: "scheduled_at", label: "Schedule", render: row => new Date(String(row.scheduled_at)).toLocaleString() }, { key: "is_published", label: "Announcement", render: row => <Badge value={row.is_published ? 'Published' : 'Draft'} /> }]}
      extraActions={row => <>{[['house_one', 'team_one', 'Result: house one'], ['house_two', 'team_two', 'Result: house two']].map(([house, team, label]) => row[house] ? <button key={house} className={button} onClick={() => setResult({ event: row.event, house: row[house], team_name: row[team], rank: '1' })}>{label}</button> : null)}</>}>
      <Panel><p className="text-sm leading-6 text-neutral-400">Save as a draft while planning. Published announcements appear publicly for unrestricted public events once the event is published or ongoing. Matches leave the upcoming list when their scheduled time passes.</p></Panel>
    </ResourcePage> : <ResourcePage key="results" title="Matchups & Results" description="Publish event placements for houses and their teams. Each result is verified and awards the event's configured placement points." endpoint="/admin/results/"
      columns={[{ key: "event_title", label: "Event" }, { key: "house_name", label: "House" }, { key: "team_name", label: "Team" }, { key: "rank", label: "Place" }, { key: "score", label: "Score" }, { key: "points_awarded", label: "Points awarded" }, { key: "is_verified", label: "Verified" }]}
      extraActions={row => <button className={button} onClick={() => setCorrect(row)}>Correct placement</button>}>
      <Panel><div className="flex flex-wrap items-center justify-between gap-4"><p className="max-w-2xl text-sm leading-6 text-neutral-400">Results can be posted for ongoing or completed events. Record final event placements here, rather than awarding placement points for every preliminary match. Corrections reverse the old award and apply the new one.</p><button className={primary} onClick={() => setResult({ rank: '1' })}>Publish a result</button></div></Panel>
    </ResourcePage>}
    {result && <Editor title="Publish house result" description="Saving verifies this result and awards placement points immediately. Public event results also appear on the public results page." path="/admin/results/" fields={resultFields} initial={result} transform={data => ({ ...data, result_type: data.team_name ? 'TEAM' : 'HOUSE', rank: Number(data.rank), score: data.score === '' ? null : data.score })} onClose={() => setResult(null)} />}
    {correct && <Editor title="Correct result placement" description="The previous points award will be reversed and replaced using the new placement." path={`/admin/results/${correct.id}/correct/`} initial={{ rank: String(correct.rank) }} fields={[{ name: 'rank', label: 'Correct placement', type: 'select', required: true, options: [1, 2, 3].map(value => ({ label: `Place ${value}`, value })) }, { name: 'reason', label: 'Reason for correction', type: 'textarea', required: true }]} onClose={() => setCorrect(null)} />}
  </div>;
}
