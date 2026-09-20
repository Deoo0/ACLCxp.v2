import { useState } from "react";
import { Archive, Download, Play, Ticket, Trash2 } from "lucide-react";
import { ResourcePage, Editor, Panel, Badge, Notice, button } from "../../components/admin/ConsoleUI";
import { useApi, queryClient, type PageData, type Row } from "../../services/queries";
import api from "../../services/api";
import { downloadBlob } from "../../services/download";

export default function SeasonsPage() {
  const seasons = useApi<PageData>('/seasons/?page_size=100');
  const [action, setAction] = useState<{ row: Row; status: string } | null>(null);
  const [purge, setPurge] = useState<Row | null>(null);
  const [digests, setDigests] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<unknown>(null);
  const hasCurrent = seasons.data?.data.some(row => row.is_current);
  async function exportSeason(row: Row) {
    setBusy(row.id); setError(null);
    try {
      const response = await api.post(`/seasons/${row.id}/export/`, {}, { responseType: 'blob', timeout: 120000 });
      downloadBlob(response.data, `season-${row.id}-export.zip`);
      setDigests(old => ({ ...old, [row.id]: String(response.headers['x-season-export-digest'] || '') }));
      await queryClient.invalidateQueries();
    } catch (err) { setError(err); } finally { setBusy(null); }
  }
  return <div className="space-y-6">
    <Panel><p className="text-xs font-bold uppercase tracking-widest text-amber-300">Controlled season lifecycle</p><h1 className="mt-2 text-2xl font-bold text-white">Fresh season. Same student accounts.</h1><p className="mt-3 text-sm leading-6 text-neutral-400">Create a season, open ticket registration, then start participation. Close the current season before opening the next. New seasons start with empty activity records and require new tickets. Your first season adopts existing records and student access after confirmation.</p></Panel>
    {error != null && <Notice error={error} />}
    <ResourcePage title="Seasons" description="Closing locks season activity. Export the closed season before optionally purging its records. Accounts, roster, houses, categories, and settings are retained." endpoint="/seasons/" canCreate fields={[{ name: 'name', label: 'Season name', required: true, hint: 'For example: Intramurals 2027' }, { name: 'starts_on', label: 'Planned start date', type: 'date' }, { name: 'ends_on', label: 'Planned end date', type: 'date' }]} columns={[{ key: 'name', label: 'Season' }, { key: 'status', label: 'Stage', render: row => <Badge value={row.purged_at ? 'PURGED' : row.status} /> }, { key: 'is_current', label: 'Current' }, { key: 'starts_on', label: 'Start' }, { key: 'ends_on', label: 'End' }, { key: 'exported_at', label: 'Last export' }]} extraActions={row => <>
      {row.status === 'DRAFT' && <button className={button} onClick={() => setAction({ row, status: 'REGISTRATION' })}><Ticket className="h-4 w-4" />Open registration</button>}
      {['DRAFT', 'REGISTRATION'].includes(String(row.status)) && <button className={button} onClick={() => setAction({ row, status: 'ACTIVE' })}><Play className="h-4 w-4" />Start season</button>}
      {['ACTIVE', 'REGISTRATION'].includes(String(row.status)) && <button className={button} onClick={() => setAction({ row, status: 'CLOSED' })}><Archive className="h-4 w-4" />Close season</button>}
      {row.status === 'CLOSED' && !row.purged_at && <><button className={button} disabled={busy !== null} onClick={() => void exportSeason(row)}><Download className="h-4 w-4" />{busy === row.id ? 'Exporting…' : 'Export ZIP'}</button><button className={button} disabled={!digests[row.id]} onClick={() => setPurge(row)}><Trash2 className="h-4 w-4" />Purge records</button></>}
    </>} />
    <Panel><p className="text-sm leading-6 text-neutral-400">Exports contain CSV reports, structured JSON, and available event artwork. Download and check the ZIP before purging; keep a separate database backup if you need full system recovery. Closing does not delete anything. Dates are planning labels; access changes only through the stage controls above.</p></Panel>
    {action && <Editor title={`${action.status === 'CLOSED' ? 'Close' : action.status === 'ACTIVE' ? 'Start' : 'Open registration for'} ${action.row.name}`} description={action.status === 'CLOSED' ? 'This immediately locks student access and season writes, including existing sessions. Finalize all results and corrections first. Closing is permanent; export is the next step.' : 'This becomes the current season for all students and administrators. Existing students must activate a new ticket, except when adopting the first season.'} path={`/seasons/${action.row.id}/transition/`} fields={!hasCurrent ? [{ name: 'adopt_existing', label: 'Adopt existing activity records and currently active student accounts into this first season', type: 'checkbox', required: true }] : []} transform={data => ({ ...data, status: action.status })} onClose={() => setAction(null)} />}
    {purge && <Editor title={`Permanently purge ${purge.name}`} description="Deletes this season's events, matches, results, registrations, attendance, points, tickets, memberships, notifications, and season logs. This cannot be undone in the app." path={`/seasons/${purge.id}/purge/`} fields={[{ name: 'confirmation', label: 'Type the exact season name', required: true, hint: String(purge.name) }, { name: 'export_saved', label: 'I downloaded, checked, and safely stored the season export', type: 'checkbox', required: true }]} transform={data => ({ ...data, export_digest: digests[purge.id] })} onClose={() => setPurge(null)} />}
  </div>;
}
