import { useState } from "react";
import {
  ResourcePage,
  Editor,
  button,
  primary,
  Badge,
} from "../../components/admin/ConsoleUI";
import type { Field } from "../../components/admin/ConsoleUI";
import type { Row } from "../../services/queries";
const student: Field = {
  name: "user",
  label: "Student",
  type: "lookup",
  endpoint: "/admin/users/?role=STUDENT",
  optionLabel: "full_name",
};
const house: Field = {
  name: "house",
  label: "House",
  type: "lookup",
  endpoint: "/admin/houses/",
};
export default function PointsPage() {
  const [tab, setTab] = useState("points");
  const [award, setAward] = useState<string | null>(null);
  const [reverse, setReverse] = useState<Row | null>(null);
  const [correct, setCorrect] = useState<Row | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          className={tab === "points" ? primary : button}
          onClick={() => setTab("points")}
        >
          Points ledger
        </button>
        <button
          className={tab === "results" ? primary : button}
          onClick={() => setTab("results")}
        >
          Competition results
        </button>
        {tab === "points" && (
          <button
            className={`${primary} sm:ml-auto`}
            onClick={() => setAward(crypto.randomUUID())}
          >
            Award / deduct points
          </button>
        )}
      </div>
      {tab === "points" ? (
        <ResourcePage
          title="Points ledger"
          description="Student and house totals are calculated from approved, unreversed entries. Correct attendance from the Attendance screen."
          endpoint="/admin/points/"
          columns={[
            { key: "student_name", label: "Student" },
            { key: "house_name", label: "House" },
            { key: "transaction_type", label: "Source" },
            { key: "points", label: "Points" },
            { key: "reason", label: "Reason" },
            { key: "is_reversed", label: "Reversed" },
          ]}
          extraActions={(r) =>
            !r.is_reversed &&
            r.transaction_type !== "PARTICIPATION" && (
              <button className={button} onClick={() => setReverse(r)}>
                Reverse
              </button>
            )
          }
        />
      ) : (
        <ResourcePage
          title="Competition results"
          description="Record verified results for ongoing or completed events. Awards use the event's configured first, second and third-place points."
          endpoint="/admin/results/"
          canCreate
          defaults={{ result_type: "INDIVIDUAL", rank: 1 }}
          fields={[
            {
              name: "event",
              label: "Event",
              type: "lookup",
              endpoint: "/events/",
              optionLabel: "title",
              required: true,
            },
            {
              name: "result_type",
              label: "Result type",
              type: "select",
              required: true,
              options: ["INDIVIDUAL", "TEAM", "HOUSE"].map((value) => ({
                label: value,
                value,
              })),
            },
            student,
            house,
            {
              name: "team_name",
              label: "Team name",
              hint: "Required for a team result. Individual results use the student's assigned house.",
            },
            {
              name: "rank",
              label: "Placement",
              type: "number",
              min: 1,
              max: 3,
              required: true,
            },
            { name: "score", label: "Score", type: "number" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]}
          columns={[
            { key: "event_title", label: "Event" },
            { key: "student_name", label: "Student" },
            { key: "house_name", label: "House" },
            { key: "team_name", label: "Team" },
            { key: "rank", label: "Place" },
            { key: "points_awarded", label: "Points" },
            {
              key: "is_verified",
              label: "Verified",
              render: (r) => <Badge value={r.is_verified} />,
            },
          ]}
          extraActions={(r) => (
            <button className={button} onClick={() => setCorrect(r)}>
              Correct result
            </button>
          )}
        />
      )}
      {award && (
        <Editor
          title="Award or deduct points"
          description="Choose a student OR a house. Student awards also credit their assigned house. Use negative points for deductions."
          path="/admin/points/award/"
          fields={[
            student,
            house,
            {
              name: "points",
              label: "Points",
              type: "number",
              required: true,
              min: -100000,
              max: 100000,
            },
            {
              name: "reason",
              label: "Reason",
              type: "textarea",
              required: true,
            },
          ]}
          transform={(data) => ({ ...data, idempotency_key: award })}
          onClose={() => setAward(null)}
        />
      )}
      {reverse && (
        <Editor
          title="Reverse points entry"
          description="The entry stays in the ledger, but no longer contributes to student or house totals."
          path={`/admin/points/${reverse.id}/reverse/`}
          fields={[
            {
              name: "reason",
              label: "Reason",
              required: true,
              type: "textarea",
            },
          ]}
          onClose={() => setReverse(null)}
        />
      )}
      {correct && (
        <Editor
          title="Correct competition result"
          description="The previous award will be reversed and the corrected placement awarded. Recipient and event remain unchanged."
          path={`/admin/results/${correct.id}/correct/`}
          fields={[
            {
              name: "rank",
              label: "Correct placement",
              type: "number",
              min: 1,
              max: 3,
              required: true,
            },
            {
              name: "reason",
              label: "Correction reason",
              type: "textarea",
              required: true,
            },
          ]}
          initial={correct}
          onClose={() => setCorrect(null)}
        />
      )}
    </div>
  );
}
