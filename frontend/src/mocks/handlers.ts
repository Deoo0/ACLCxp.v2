import { http, HttpResponse } from "msw";
import data from "./data";
// Opt-in fixtures only. The application always uses live APIs.
export const handlers = [
  http.get("/api/events", () => HttpResponse.json({ events: data.mockEvents })),
  http.get("/api/leaderboard", () => HttpResponse.json({ leaderboard: data.mockLeaderboard })),
  http.get("/api/students", () => HttpResponse.json({ students: data.mockStudents })),
];
export default handlers;
