// frontend/src/pages/admin/AdminDashboard.tsx
import { useState, useEffect } from 'react'
import api from '../../services/api'

interface DashboardStats {
  total_users: number
  total_events: number
  total_attendance: number
  active_houses: number
  recent_registrations: number
  upcoming_events: number
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // const response = await api.get('/analytics/dashboard-stats/')
      // setStats(response.data)
      
      // Mock data for now
      setStats({
        total_users: 3245,
        total_events: 87,
        total_attendance: 12543,
        active_houses: 5,
        recent_registrations: 234,
        upcoming_events: 15
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Students', value: stats?.total_users || 0, icon: '👥', color: 'from-blue-500 to-cyan-500', change: '+12%' },
    { label: 'Active Events', value: stats?.total_events || 0, icon: '📅', color: 'from-purple-500 to-pink-500', change: '+8%' },
    { label: 'Attendance Records', value: stats?.total_attendance || 0, icon: '✅', color: 'from-emerald-500 to-teal-500', change: '+23%' },
    { label: 'Houses', value: stats?.active_houses || 0, icon: '🏆', color: 'from-orange-500 to-red-500', change: '0%' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Welcome back! Here's what's happening with ACLCxp today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-white/10 p-6 hover:border-white/20 transition-all"
          >
            <div className="absolute top-0 right-0 w-20 h-20 opacity-20">
              <div className={`w-full h-full rounded-full bg-gradient-to-br ${card.color} blur-2xl`}></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <span className="text-2xl">{card.icon}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  card.change.startsWith('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {card.change}
                </span>
              </div>
              
              <p className="text-3xl font-bold text-white mb-1">{card.value.toLocaleString()}</p>
              <p className="text-sm text-slate-400">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Registrations */}
        <div className="rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Registrations</h2>
            <button className="text-sm text-indigo-400 hover:text-indigo-300">View All →</button>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">JD</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Juan Dela Cruz</p>
                  <p className="text-xs text-slate-400">Registered for Intramurals 2026</p>
                </div>
                <span className="text-xs text-slate-500">2m ago</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
            <button className="text-sm text-indigo-400 hover:text-indigo-300">View All →</button>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <span className="text-lg">🎯</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Tech Summit 2026</p>
                  <p className="text-xs text-slate-400">March 15, 2026 • 234 registered</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="text-xs text-emerald-400">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <button className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:border-indigo-500/40 transition-all group">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-xl">➕</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Add User</p>
            <p className="text-xs text-slate-400">Create new student</p>
          </div>
        </button>

        <button className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-xl">📅</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Create Event</p>
            <p className="text-xs text-slate-400">New event</p>
          </div>
        </button>

        <button className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-all group">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-xl">📊</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">View Reports</p>
            <p className="text-xs text-slate-400">Analytics</p>
          </div>
        </button>

        <button className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 hover:border-pink-500/40 transition-all group">
          <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-xl">📝</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Audit Logs</p>
            <p className="text-xs text-slate-400">Security</p>
          </div>
        </button>
      </div>
    </div>
  )
}

export default AdminDashboard