import type { Field } from "./ConsoleUI";

type Section = { title: string; description: string; names: string[] };
const section = (title: string, description: string, names: string): Section => ({ title, description, names: names.split(' ') });

export function editorSections(path: string, fields: Field[]) {
  let layout: Section[];
  if (path.startsWith('/admin/matchups/')) layout = [
    section('Match overview', 'Choose the event and give this round a recognizable name.', 'event label'),
    section('Side one', 'Select a house and optional team, or use an earlier match winner. Leave all three blank for TBD.', 'house_one team_one source_one'),
    section('Side two', 'Choose the opposing house or its source match. Do not combine a house with a source.', 'house_two team_two source_two'),
    section('Schedule & publication', 'Set the date when known and decide whether the match is public.', 'scheduled_at is_published'),
    section('Match outcome', 'Record the winning side independently of final tournament placements.', 'winner_side'),
  ];
  else if (path.startsWith('/events/categories/')) layout = [section('Category identity', 'How this category appears in event listings.', 'name slug description'), section('Display & availability', 'Control ordering and whether the category can be selected.', 'display_order is_active')];
  else if (path.startsWith('/events/')) layout = [
    section('Event overview', 'Introduce the event and help students understand what to expect.', 'title slug category description'),
    section('When & where', 'Set the event date, time, and venue.', 'event_date start_time end_time venue'),
    section('Registration', 'Manage available places and the registration window.', 'capacity allow_waitlist registration_opens_at registration_closes_at'),
    section('Audience', 'Choose who can access and register for this event.', 'visibility allowed_programs allowed_houses allowed_year_levels'),
    section('Points & rewards', 'Configure participation and final placement awards.', 'participation_points first_place_points second_place_points third_place_points prizes'),
    section('Event artwork', 'Upload a background and poster. Preview and crop before saving.', 'banner_image poster_image'),
    section('Participation guide', 'Give students clear instructions for taking part.', 'requirements rules'),
    section('Event status', 'Apply the next step in the event lifecycle.', 'status'),
  ];
  else if (path.startsWith('/admin/users/') || path.startsWith('/admin/roster/')) layout = [
    section('Personal details', 'Keep student identification and contact details up to date.', 'student_number first_name middle_name last_name email'),
    section('Academic & house assignment', 'Set the student’s program, year, section, and house.', 'program year_level section house_id'),
    section('Access & security', 'Manage account access and activation eligibility.', 'role is_active is_eligible password'),
  ];
  else if (path.startsWith('/admin/houses/')) layout = [
    section('House identity', 'The name, color, and message that represent this house.', 'name color_code motto description'),
    section('House logo', 'Upload a JPG or PNG and optionally crop it to a square.', 'logo_url'),
    section('Availability', 'Control whether the house is active.', 'is_active'),
  ];
  else if (path.startsWith('/admin/results/')) layout = [
    section('Event & competitor', 'Select the event and the student, house, or team receiving this result.', 'event result_type user house team_name'),
    section('Performance', 'Record the final placement and score.', 'rank score'),
    section('Result notes', 'Provide context for the result or explain the correction.', 'notes reason'),
  ];
  else if (path.startsWith('/admin/points/')) layout = [
    section('Recipient', 'Choose a student or a house for this adjustment.', 'user house'),
    section('Points adjustment', 'Enter the amount and document why it is changing.', 'points reason'),
  ];
  else if (path.startsWith('/admin/settings/')) layout = [section('Setting configuration', 'Review the setting below before applying your update.', 'value')];
  else layout = [section('Update details', 'Review the information for this action.', 'reason')];
  const assigned = new Set<string>();
  const groups = layout.map(group => ({ ...group, fields: group.names.flatMap(name => {
    const field = fields.find(item => item.name === name);
    if (!field) return [];
    assigned.add(name);
    return [field];
  }) })).filter(group => group.fields.length);
  const remaining = fields.filter(field => !assigned.has(field.name));
  if (remaining.length) groups.push({ title: 'Additional details', description: 'Complete the remaining information for this record.', names: [], fields: remaining });
  return groups;
}
