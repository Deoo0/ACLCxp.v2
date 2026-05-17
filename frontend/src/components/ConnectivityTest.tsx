import { useState } from 'react'
import api from '../services/api'
import axios from 'axios'

interface HealthCheckResponse {
  status: string
  message: string
  timestamp: string
}

interface EchoResponse {
  method: string
  message: string
  received_data?: { message: string; timestamp: string; test: boolean }
}

const ConnectivityTest = () => {
  const [healthStatus, setHealthStatus] = useState<string>('Not tested')
  const [echoResult, setEchoResult] = useState<string>('Not tested')
  const [loading, setLoading] = useState<boolean>(false)
  const [testInput, setTestInput] = useState<string>('Hello from React!')

  const testHealthCheck = async () => {
    setLoading(true)
    try {
      const response = await api.get<HealthCheckResponse>('users/health/')
      setHealthStatus(`✅ SUCCESS: ${response.data.message}`)
      console.log('Health check response:', response.data)
    } catch (error: unknown) {
      const message = error instanceof axios.AxiosError ? error.message : (error as Error).message
      setHealthStatus(`❌ FAILED: ${message}`)
      console.error('Health check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testEcho = async () => {
    setLoading(true)
    try {
      const response = await api.post<EchoResponse>('users/echo/', {
        message: testInput,
        timestamp: new Date().toISOString(),
        test: true,
      })
      setEchoResult(`✅ SUCCESS: ${response.data.message}`)
      console.log('Echo response:', response.data)
    } catch (error: unknown) {
      const message = error instanceof axios.AxiosError ? error.message : (error as Error).message
      setEchoResult(`❌ FAILED: ${message}`)
      console.error('Echo error:', error)
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    await testHealthCheck()
    await new Promise((resolve) => setTimeout(resolve, 500))
    await testEcho()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-10 sm:px-6 sm:py-12">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 relative z-10">
        {/* Header Section */}
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-indigo-300">
              System Diagnostics
            </span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-indigo-200 to-emerald-200 bg-clip-text text-transparent">
              API Connectivity Test
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl">
              Verify that your React frontend is communicating correctly with the Django backend API.
            </p>
          </div>

          {/* Environment Info Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-white/10 p-6 hover:border-indigo-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Environment Configuration
                </h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-slate-400 min-w-[80px]">API URL:</span>
                  <span className="text-sm text-white font-mono bg-slate-950/50 px-3 py-1 rounded-lg border border-white/5">
                    {import.meta.env.VITE_API_URL ?? 'Not configured'}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-slate-400 min-w-[80px]">Base Path:</span>
                  <span className="text-sm text-white font-mono bg-slate-950/50 px-3 py-1 rounded-lg border border-white/5">
                    {import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'Not configured'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Test Cards Grid */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Health Check Test */}
          <div className="group relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-white/10 p-6 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">GET Request</span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white">
                    Health Check
                  </h3>
                  <p className="text-sm text-slate-400">
                    Verify backend is reachable and responding correctly.
                  </p>
                </div>
              </div>

              <button
                onClick={testHealthCheck}
                disabled={loading}
                className="w-full group/btn relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Testing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      Run Test
                    </>
                  )}
                </span>
              </button>

              <div className={`rounded-xl p-4 border transition-all duration-300 ${
                healthStatus.includes('SUCCESS') 
                  ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/10' 
                  : healthStatus === 'Not tested'
                  ? 'bg-slate-800/50 border-slate-700/50'
                  : 'bg-rose-500/10 border-rose-500/30 shadow-lg shadow-rose-500/10'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    healthStatus.includes('SUCCESS') ? 'bg-emerald-500/20' : healthStatus === 'Not tested' ? 'bg-slate-700' : 'bg-rose-500/20'
                  }`}>
                    {healthStatus.includes('SUCCESS') ? '✓' : healthStatus === 'Not tested' ? '•' : '✕'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${
                      healthStatus.includes('SUCCESS') ? 'text-emerald-400' : healthStatus === 'Not tested' ? 'text-slate-400' : 'text-rose-400'
                    }`}>
                      Result
                    </p>
                    <p className={`text-sm font-medium break-words ${
                      healthStatus.includes('SUCCESS') ? 'text-emerald-300' : healthStatus === 'Not tested' ? 'text-slate-400' : 'text-rose-300'
                    }`}>
                      {healthStatus}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Echo Test */}
          <div className="group relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-white/10 p-6 hover:border-sky-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl group-hover:bg-sky-500/10 transition-colors"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20">
                      <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-sky-400 uppercase tracking-wider">POST Request</span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white">
                    Echo Test
                  </h3>
                  <p className="text-sm text-slate-400">
                    Send data to backend and verify the response payload.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Test Message
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
                    placeholder="Enter message to send..."
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                onClick={testEcho}
                disabled={loading}
                className="w-full group/btn relative overflow-hidden rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-sky-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Testing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      Run Test
                    </>
                  )}
                </span>
              </button>

              <div className={`rounded-xl p-4 border transition-all duration-300 ${
                echoResult.includes('SUCCESS') 
                  ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/10' 
                  : echoResult === 'Not tested'
                  ? 'bg-slate-800/50 border-slate-700/50'
                  : 'bg-rose-500/10 border-rose-500/30 shadow-lg shadow-rose-500/10'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    echoResult.includes('SUCCESS') ? 'bg-emerald-500/20' : echoResult === 'Not tested' ? 'bg-slate-700' : 'bg-rose-500/20'
                  }`}>
                    {echoResult.includes('SUCCESS') ? '✓' : echoResult === 'Not tested' ? '•' : '✕'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${
                      echoResult.includes('SUCCESS') ? 'text-emerald-400' : echoResult === 'Not tested' ? 'text-slate-400' : 'text-rose-400'
                    }`}>
                      Result
                    </p>
                    <p className={`text-sm font-medium break-words ${
                      echoResult.includes('SUCCESS') ? 'text-emerald-300' : echoResult === 'Not tested' ? 'text-slate-400' : 'text-rose-300'
                    }`}>
                      {echoResult}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Run All Tests Section */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-orange-500/20 p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Complete System Check
                </h2>
              </div>
              <p className="text-slate-300">
                Run both tests sequentially to verify full backend connectivity and data handling.
              </p>
            </div>
            <button
              onClick={runAllTests}
              disabled={loading}
              className="group/btn relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-base font-semibold text-white transition-all hover:shadow-xl hover:shadow-orange-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Running Tests...
                  </>
                ) : (
                  <>
                    🚀 Run All Tests
                  </>
                )}
              </span>
            </button>
          </div>
        </section>

        {/* Troubleshooting Section */}
        <section className="rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-white/10 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">
              Troubleshooting Guide
            </h2>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">✓</div>
              <div>
                <p className="text-sm font-medium text-emerald-300 mb-1">Both tests SUCCESS</p>
                <p className="text-xs text-slate-400">Connection working perfectly</p>
              </div>
            </div>
            
            <div className="flex gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 text-sm">✕</div>
              <div>
                <p className="text-sm font-medium text-rose-300 mb-1">Network Error</p>
                <p className="text-xs text-slate-400">Backend not running or wrong API URL</p>
              </div>
            </div>
            
            <div className="flex gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 text-sm">✕</div>
              <div>
                <p className="text-sm font-medium text-rose-300 mb-1">CORS Error</p>
                <p className="text-xs text-slate-400">Verify Django CORS settings</p>
              </div>
            </div>
            
            <div className="flex gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 text-sm">✕</div>
              <div>
                <p className="text-sm font-medium text-rose-300 mb-1">404 Not Found</p>
                <p className="text-xs text-slate-400">Check backend routes and API base path</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-slate-300">
                <span className="font-medium text-white">Pro tip:</span> Open browser DevTools → Network tab to inspect request details, response codes, and error messages.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default ConnectivityTest