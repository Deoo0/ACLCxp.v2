import { rest } from 'msw';
import data from './data';

export const handlers = [
  rest.get('/api/events', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ events: data.mockEvents }));
  }),

  rest.get('/api/leaderboard', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ leaderboard: data.mockLeaderboard }));
  }),

  rest.get('/api/students', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ students: data.mockStudents }));
  }),
];

export default handlers;
