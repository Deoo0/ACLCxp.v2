import { faker } from '@faker-js/faker';

export type EventItem = {
  id: string;
  title: string;
  house: string;
  startAt: string;
  endAt: string;
  location?: string;
  attendees: number;
  recommendedScore: number;
  badge?: string;
};

export type Student = {
  id: string;
  name: string;
  house: string;
  xp: number;
  level: number;
  avatar: string;
};

export const houses = ['Aquila', 'Basilis', 'Cygni', 'Draco'];

export const mockStudents = Array.from({ length: 24 }).map(() => {
  const xp = faker.number.int({ min: 120, max: 9800 });
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    house: faker.helpers.arrayElement(houses),
    xp,
    level: Math.floor(Math.sqrt(xp / 100)),
    avatar: `https://i.pravatar.cc/150?u=${faker.string.uuid()}`
  } as Student;
});

export const mockEvents: EventItem[] = Array.from({ length: 12 }).map((_, i) => {
  const start = faker.date.soon({ days: faker.number.int({ min: 1, max: 14 }) });
  const end = new Date(start.getTime() + faker.number.int({ min: 30, max: 180 }) * 60000);
  return {
    id: `evt_${i}_${faker.string.alphanumeric(6)}`,
    title: faker.word.words({ count: faker.number.int({ min: 2, max: 6 }) }),
    house: faker.helpers.arrayElement(houses),
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    location: faker.location.city(),
    attendees: faker.number.int({ min: 5, max: 400 }),
    recommendedScore: faker.number.int({ min: 40, max: 99 }),
    badge: faker.helpers.maybe(() => faker.word.noun())
  };
});

export const mockLeaderboard = mockStudents
  .slice()
  .sort((a, b) => b.xp - a.xp)
  .slice(0, 10)
  .map((s, idx) => ({ rank: idx + 1, ...s }));

export default { mockStudents, mockEvents, mockLeaderboard };
