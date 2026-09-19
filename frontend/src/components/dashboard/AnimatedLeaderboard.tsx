import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockLeaderboard } from '../../mocks/data';

export const AnimatedLeaderboard: React.FC = () => {
  const items = mockLeaderboard;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Top Players</h4>
        <div className="text-sm text-[var(--muted)]">Live</div>
      </div>

      <ol className="space-y-2">
        <AnimatePresence>
          {items.map((u) => (
            <motion.li key={u.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center justify-between p-2 rounded-md hover:bg-[var(--glass)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-semibold">{u.rank}</div>
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-[var(--muted)]">{u.house}</div>
                </div>
              </div>
              <div className="text-sm font-semibold">{u.xp} XP</div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
};

export default AnimatedLeaderboard;
