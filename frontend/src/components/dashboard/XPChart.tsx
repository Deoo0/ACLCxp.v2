import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const sample = Array.from({ length: 7 }).map((_, i) => ({
  day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
  xp: Math.floor(200 + Math.random() * 600)
}));

export const XPChart: React.FC = () => {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Weekly XP</h4>
        <div className="text-sm text-[var(--muted)]">Last 7 days</div>
      </div>
      <div style={{ width: '100%', height: 160 }}>
        <ResponsiveContainer>
          <AreaChart data={sample}>
            <defs>
              <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6C5CE7" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#00C2A8" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.04} />
            <XAxis dataKey="day" tick={{ fill: 'var(--muted)' }} />
            <YAxis tick={{ fill: 'var(--muted)' }} />
            <Tooltip />
            <Area type="monotone" dataKey="xp" stroke="#6C5CE7" fillOpacity={1} fill="url(#xpGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default XPChart;
