# Tournament matches and final placements

In **Admin → Matchups & Results → Matchups**, create each match with a unique,
descriptive round label (for example, Semifinal A, Semifinal B, Grand Final).

For each side, either select a house and optional team name, leave it blank for
**To be determined**, or select an earlier match in the same event as its source.
When using a source, leave that side's house and team fields blank. Both sides may
come from earlier matches. A waiting house can also face the winner of a semifinal.
The schedule is optional, and a match can be published while an opponent is unknown.

Use **Pick match winner** when both participating houses are determined. This marks
the match complete and automatically resolves linked later-round participants,
including their team names and house logos. It creates no event placement and awards
no points. Pending matches remain visible after their scheduled time until a winner
is recorded. Completed published matches appear under **Match winners**.

Use **Correct / clear winner** for mistakes. Completed downstream results must be
cleared first, working backward through the rounds. Clearing a source winner returns
the linked slot to its waiting state. Linked matches cannot be deleted until their
downstream links are removed. Circular and cross-event links are rejected.

Publish **final event placements** separately in the Results tab when the tournament
finishes. These verified placements award the event's configured points. They are
independent records; changing a bracket winner does not rewrite previously awarded
final placements. Correct those through the existing placement correction workflow.

This supports manually configured winner-advancement brackets. It does not generate
seedings or automatically route losing teams into a double-elimination bracket.
