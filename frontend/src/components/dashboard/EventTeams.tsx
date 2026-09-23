import Carousel from "../ui/Carousel";
import type { EventTeam } from "../admin/EventTeamsEditor";

export default function EventTeams({ teams }: { teams: unknown }) {
  if (!Array.isArray(teams) || !teams.length) return null;
  return <section className="min-w-0 border-t border-white/10 p-5 sm:p-8">
    <h3 className="mb-2 text-xl font-semibold text-white">Meet the house teams</h3>
    <p className="mb-5 text-sm text-neutral-400">The people representing each house.</p>
    <Carousel label="house teams" single>{(teams as EventTeam[]).map(team => <article key={team.house} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
      {team.photo && <img src={team.photo} alt={`${team.house_name} team`} loading="lazy" className="aspect-[16/9] max-h-96 w-full bg-black/30 object-contain" />}
      <div className="p-5"><h4 className="text-lg font-semibold text-amber-200">{team.house_name}</h4>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">{team.members.map((member, index) => <li key={index} className="min-w-0 rounded-xl bg-white/5 px-4 py-3"><p className="break-words text-sm font-medium text-white">{member.name}</p><p className="mt-1 break-words text-xs text-neutral-400">{member.role}</p></li>)}</ul>
      </div>
    </article>)}</Carousel>
  </section>;
}
