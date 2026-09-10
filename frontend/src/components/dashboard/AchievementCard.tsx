import React from 'react';
import { motion } from 'framer-motion';

export const AchievementCard: React.FC<{ title: string; description?: string; unlocked?: boolean }> = ({ title, description, unlocked = false }) => {
  return (
    <motion.div animate={{ scale: unlocked ? 1.03 : 1 }} whileHover={{ scale: 1.02 }} className={`p-3 rounded-md border border-[var(--card-border)] bg-[var(--color-surface)] text-center ${unlocked ? 'shadow-soft-md' : ''}`}>
      <div className="text-2xl">{unlocked ? '🎉' : '🔒'}</div>
      <div className="font-medium mt-2">{title}</div>
      {description && <div className="text-xs text-[var(--muted)] mt-1">{description}</div>}
    </motion.div>
  );
};

export default AchievementCard;
