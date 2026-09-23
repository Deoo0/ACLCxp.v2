import { useApi, type PageData } from "../../services/queries";
import ImageUpload from "./ImageUpload";

export interface EventTeam {
  house: number | string;
  house_name?: string;
  photo?: string;
  members: { name: string; role: string }[];
}
const control = "min-h-11 rounded-lg border border-white/15 bg-neutral-950 px-3 py-2 text-sm text-neutral-200";

export default function EventTeamsEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const teams: EventTeam[] = JSON.parse(value || "[]");
  const houses = useApi<PageData>("/admin/houses/?page_size=100");
  const save = (next: EventTeam[]) => onChange(JSON.stringify(next));
  const update = (index: number, data: Partial<EventTeam>) => save(teams.map((team, i) => i === index ? { ...team, ...data } : team));
  return <div className="space-y-4">
    <p className="text-xs leading-5 text-neutral-400">Optional. Add a card for each participating house. Cards appear in this order in event details.</p>
    {teams.map((team, index) => <fieldset key={team.house || `new-${index}`} className="min-w-0 space-y-4 rounded-xl border border-white/15 p-4">
      <legend className="px-2 text-sm text-amber-200">House team {index + 1}</legend>
      <label className="block text-xs">House<select required aria-label={`House for team ${index + 1}`} className={`${control} mt-2 w-full`} value={team.house} onChange={e => update(index, { house: Number(e.target.value), photo: "", house_name: undefined })}>
        <option value="">Choose a house</option>
        {team.house && !houses.data?.data.some(house => house.id === Number(team.house)) && <option value={team.house}>{team.house_name || `House ${team.house}`}</option>}
        {houses.data?.data.map(house => <option key={house.id} value={house.id} disabled={teams.some((other, i) => i !== index && Number(other.house) === house.id)}>{String(house.name)}</option>)}
      </select></label>
      {houses.isError && <p role="alert" className="text-xs text-rose-300">Could not load houses. <button type="button" onClick={() => void houses.refetch()}>Retry</button></p>}
      <ImageUpload label={`Team ${index + 1} photo`} value={team.photo || ""} onChange={photo => update(index, { photo })} />
      <div className="space-y-3">{team.members.map((member, memberIndex) => <div key={memberIndex} className="grid min-w-0 gap-2 rounded-lg bg-white/5 p-3 sm:grid-cols-[1fr_1fr_auto]">
        <input required maxLength={150} className={`${control} min-w-0`} aria-label={`Team ${index + 1}, member ${memberIndex + 1} name`} placeholder="Member name" value={member.name} onChange={e => update(index, { members: team.members.map((m, i) => i === memberIndex ? { ...m, name: e.target.value } : m) })} />
        <input required maxLength={100} className={`${control} min-w-0`} aria-label={`Team ${index + 1}, member ${memberIndex + 1} role`} placeholder="Role, e.g. Captain" value={member.role} onChange={e => update(index, { members: team.members.map((m, i) => i === memberIndex ? { ...m, role: e.target.value } : m) })} />
        <button type="button" className={control} aria-label={`Remove member ${memberIndex + 1} from team ${index + 1}`} onClick={() => update(index, { members: team.members.filter((_, i) => i !== memberIndex) })}>Remove</button>
      </div>)}</div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={control} disabled={team.members.length >= 100} onClick={() => update(index, { members: [...team.members, { name: "", role: "" }] })}>Add member</button>
        <button type="button" className={control} onClick={() => save(teams.filter((_, i) => i !== index))}>Remove house team</button>
      </div>
    </fieldset>)}
    <button type="button" className={control} disabled={teams.length >= 30 || teams.some(team => !team.house)} onClick={() => save([...teams, { house: "", photo: "", members: [] }])}>Add house team</button>
  </div>;
}
