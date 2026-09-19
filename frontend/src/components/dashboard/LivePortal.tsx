import type { ReactNode } from "react";
import { Trophy } from "lucide-react";
import { Panel } from "../admin/ConsoleUI";
import type { Row } from "../../services/queries";
export interface StudentSummary {
  points: number;
  rank: number;
  attendance: number;
  registered: number;
  houses: Row[];
  settings: {
    announcement: string;
    support_email: string;
    merit_milestone: string;
    registration_enabled: string;
  };
}
export function StudentFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 text-neutral-200 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
export function HouseStandings({ houses }: { houses: Row[] }) {
  return (
    <Panel>
      <h2 className="flex items-center gap-2 font-semibold text-white">
        <Trophy className="h-5 w-5 text-amber-400" />
        House leaderboard
      </h2>
      <div className="mt-5 space-y-4">
        {houses.map((house, index) => (
          <div
            className="flex items-center gap-3 rounded-xl bg-white/[.025] p-3"
            key={house.id}
          >
            <span className="w-6 font-mono text-sm text-neutral-500">
              {index + 1}
            </span>
            <div
              className="h-9 w-9 shrink-0 rounded-xl border border-white/10"
              style={{ backgroundColor: String(house.color_code) }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-200">
                {String(house.name)}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {String(house.member_count)} students
              </p>
            </div>
            <span className="font-semibold text-amber-300">
              {Number(house.total_points).toLocaleString()}
              <span className="ml-1 text-xs font-normal text-neutral-500">
                pts
              </span>
            </span>
          </div>
        ))}
        {!houses.length && (
          <p className="text-sm text-neutral-500">
            House standings will appear when the school adds its houses.
          </p>
        )}
      </div>
    </Panel>
  );
}
