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
      const response = await api.get<HealthCheckResponse>('/health/')
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
      const response = await api.post<EchoResponse>('/echo/', {
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
    <main className="min-h-screen bg-slate-950 text-white px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.24em] text-indigo-300">
              Connectivity Test
            </p>
            
            <h1 className="text-3xl font-semibold sm:text-4xl">
              🔌 Frontend ↔️ Backend Connectivity Test
            </h1>
            <p className="text-slate-400">
              Verify that your React frontend is communicating correctly with the Django backend API.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-800/90 p-5 border border-indigo-500/10">
            <h2 className="text-lg font-semibold text-white">
              Environment Info
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>
                <span className="font-semibold text-white">
                  API URL:
                </span> {import.meta.env.VITE_API_URL ?? 'Not configured'}
              </p>
              
              <p>
                <span className="font-semibold text-white">
                  Base Path:
              </span> {import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'Not configured'}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Test 1: Health Check (GET)
                </h2>

                <p className="mt-2 text-slate-400">
                  Check whether the backend is reachable and responding.
                </p>
              </div>

              <button
                onClick={testHealthCheck}
                disabled={loading}
                className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? 'Testing...' : 'Test Health Check'}
              </button>
            </div>

            <div className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${healthStatus.includes('SUCCESS') ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
              <span className="font-semibold">
                Result:
              </span> {healthStatus}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Test 2: Echo Test (POST)
                </h2>

                <p className="mt-2 text-slate-400">
                  Send a sample message through the API and confirm the response.
                </p>
              </div>

              <button
                onClick={testEcho}
                disabled={loading}
                className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? 'Testing...' : 'Test Echo'}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-200">
                Message to send
              </label>

              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Enter message to send..."
              />
            </div>

            <div className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${echoResult.includes('SUCCESS') ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
              <span className="font-semibold">
                Result:
              </span> {echoResult}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-semibold text-white">
              Run all tests
            </h2>
            <p className="mt-2 text-slate-400">
              Run both checks in sequence to verify full backend connectivity.
            </p>
          </div>
          <div className="mt-6 flex justify-center sm:justify-start">
            <button
              onClick={runAllTests}
              disabled={loading}
              className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Running Tests...' : '🚀 Run All Tests'}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20">
          <h2 className="text-xl font-semibold text-white">📋 Troubleshooting</h2>
          <ul className="mt-4 space-y-3 text-slate-300">
            <li>✅ Both tests show SUCCESS → Connection working perfectly.</li>
            <li>❌ Network Error → Backend not running or wrong API URL.</li>
            <li>❌ CORS Error → Verify Django CORS settings.</li>
            <li>❌ 404 Not Found → Confirm backend routes and API base path.</li>
          </ul>
          <p className="mt-4 text-sm text-slate-400">Open browser DevTools → Network tab to inspect request details and response codes.</p>
        </section>
      </div>
    </main>
  )
}

export default ConnectivityTest
