// frontend/src/pages/admin/UsersManagement.tsx
import { useState, useEffect } from 'react'
import api from '../../services/api'

interface User {
  id: number
  email: string
  student_id: string
  first_name: string
  last_name: string
  full_name: string
  role: string
  program: string
  year_level: number
  house_name?: string
  is_active: boolean
}

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // const response = await api.get('/users/')
      // setUsers(response.data)
      
      // Mock data
      setUsers([
        {
          id: 1,
          email: 'juan@aclc.edu.ph',
          student_id: '2024-001',
          first_name: 'Juan',
          last_name: 'Dela Cruz',
          full_name: 'Juan Dela Cruz',
          role: 'STUDENT',
          program: 'CS',
          year_level: 1,
          house_name: 'Phoenix',
          is_active: true
        },
        {
          id: 2,
          email: 'maria@aclc.edu.ph',
          student_id: '2024-002',
          first_name: 'Maria',
          last_name: 'Santos',
          full_name: 'Maria Santos',
          role: 'STUDENT',
          program: 'IT',
          year_level: 2,
          house_name: 'Griffin',
          is_active: true
        },
        // Add more mock users...
      ])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'ALL' || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
      ORGANIZER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      FACILITATOR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      HOUSE_LEADER: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      STUDENT: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    }
    return colors[role] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Users Management</h1>
          <p className="text-slate-400">Manage all users, roles, and permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
        >
          <span className="text-xl">➕</span>
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-white/10 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Search Users</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or student ID..."
                className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
              />
              <svg className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="FACILITATOR">Facilitators</option>
              <option value="ORGANIZER">Organizers</option>
              <option value="HOUSE_LEADER">House Leaders</option>
              <option value="ADMIN">Administrators</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-xs text-slate-400 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-white">{users.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Active</p>
            <p className="text-2xl font-bold text-emerald-400">{users.filter(u => u.is_active).length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Students</p>
            <p className="text-2xl font-bold text-indigo-400">{users.filter(u => u.role === 'STUDENT').length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Staff</p>
            <p className="text-2xl font-bold text-purple-400">{users.filter(u => u.role !== 'STUDENT').length}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Program</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">House</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No users found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {user.first_name[0]}{user.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.full_name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-slate-300">{user.student_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">{user.program} - Year {user.year_level}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">{user.house_name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing <span className="font-medium text-white">{filteredUsers.length}</span> of <span className="font-medium text-white">{users.length}</span> users
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UsersManagement