import React from 'react';
import { motion } from 'framer-motion';
import { mockEvents, mockLeaderboard, mockStudents } from '../../mocks/data.ts';
import { format, differenceInDays } from 'date-fns';
import AnimatedNumber from '../../ui/AnimatedNumber';
import { burstConfetti } from '../../ui/Confetti';
import AnimatedLeaderboard from '../../components/dashboard/AnimatedLeaderboard';
import XPChart from '../../components/dashboard/XPChart';
import AchievementCard from '../../components/dashboard/AchievementCard';

function XPCard() {
  const xp = 3240; // placeholder
  const level = Math.floor(Math.sqrt(xp / 100));
  const progress = Math.min(100, (xp % 1000) / 10 + 20);

  React.useEffect(() => {
    // simple milestone: if progress is near complete, burst confetti
    if (progress >= 95) {
      const t = setTimeout(() => burstConfetti(), 600);
      return () => clearTimeout(t);
    }
  }, [progress]);

  return (
    <div className="card p-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
      <div>
        <p className="text-sm text-[var(--muted)]">XP Progress</p>
        <h3 className="text-2xl font-bold">Level {level}</h3>
        <p className="text-sm text-[var(--muted)] mt-1"><AnimatedNumber value={xp} /> XP • {progress}% to next level</p>
        <div className="w-full bg-[var(--card-border)] rounded-full h-3 mt-4 overflow-hidden">
          <motion.div style={{ width: `${progress}%` }} className="h-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]" layout transition={{ duration: 0.8 }} />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-primary)] flex items-center justify-center text-white text-lg font-semibold">
          {level}
        </div>
      </div>
    </div>
  );
}

function UpcomingEvents() {
  const upcoming = mockEvents.slice(0, 4);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Today's & Upcoming</h4>
        <a href="/events" className="text-sm text-[var(--muted)]">See all</a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {upcoming.map((e) => (
          <motion.div key={e.id} whileHover={{ y: -6 }} className="p-3 rounded-md bg-[var(--color-surface)] border border-[var(--card-border)]">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-semibold">{e.title}</h5>
                <p className="text-sm text-[var(--muted)]">{e.house} • {format(new Date(e.startAt), 'MMM d • h:mm a')}</p>
              </div>
              <div className="text-sm text-[var(--muted)]">{e.attendees} attending</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted)]">Good afternoon</p>
              <h2 className="text-2xl font-bold">Alex Guerrero</h2>
              <p className="text-sm text-[var(--muted)] mt-1">Keep your streak — 4 days in a row</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-[var(--muted)]">House Power</div>
                <div className="text-lg font-semibold">Aquila • 7,840</div>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-primary)] flex items-center justify-center text-white">AQ</div>
            </div>
          </div>
        </section>

        <XPCard />

        <XPChart />

        <UpcomingEvents />
      </div>

      <aside className="space-y-6">
        <AnimatedLeaderboard />

        <div className="card p-4">
          <h4 className="font-semibold mb-3">Achievements</h4>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <AchievementCard key={i} title={`Badge ${i + 1}`} unlocked={i % 2 === 0} description={i % 2 === 0 ? 'Unlocked by attending 3 events' : 'Locked - complete challenges'} />
            ))}
          </div>
        </div>

      </aside>
    </div>
  );
}
