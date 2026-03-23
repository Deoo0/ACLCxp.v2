import { useState } from 'react';
import api from '../services/api';

interface HealthCheckResponse {
  status: string;
  message: string;
  timestamp: string;
}

interface EchoResponse {
  method: string;
  message: string;
  received_data?: any;
}

const ConnectivityTest = () => {
  const [healthStatus, setHealthStatus] = useState<string>('Not tested');
  const [echoResult, setEchoResult] = useState<string>('Not tested');
  const [loading, setLoading] = useState<boolean>(false);
  const [testInput, setTestInput] = useState<string>('Hello from React!');

  // Test 1: Health Check (GET request)
  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await api.get<HealthCheckResponse>('/health/');
      setHealthStatus(`✅ SUCCESS: ${response.data.message}`);
      console.log('Health check response:', response.data);
    } catch (error: any) {
      setHealthStatus(`❌ FAILED: ${error.message}`);
      console.error('Health check error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Echo Test (POST request)
  const testEcho = async () => {
    setLoading(true);
    try {
      const response = await api.post<EchoResponse>('/echo/', {
        message: testInput,
        timestamp: new Date().toISOString(),
        test: true
      });
      setEchoResult(`✅ SUCCESS: ${response.data.message}`);
      console.log('Echo response:', response.data);
    } catch (error: any) {
      setEchoResult(`❌ FAILED: ${error.message}`);
      console.error('Echo error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Run All Tests
  const runAllTests = async () => {
    await testHealthCheck();
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    await testEcho();
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🔌 Frontend ↔️ Backend Connectivity Test</h1>
      
      <div style={{ 
        background: '#858585', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>Environment Info:</h3>
        <p><strong>API URL:</strong> {import.meta.env.VITE_API_URL}</p>
        <p><strong>Base Path:</strong> {import.meta.env.VITE_API_URL}/api</p>
      </div>

      {/* Test 1: Health Check */}
      <div style={{ 
        border: '1px solid #ddd', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '15px'
      }}>
        <h3>Test 1: Health Check (GET)</h3>
        <p>Tests if backend is reachable and responding</p>
        <button 
          onClick={testHealthCheck} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Testing...' : 'Test Health Check'}
        </button>
        <p style={{ 
          marginTop: '10px', 
          padding: '10px', 
          background: healthStatus.includes('SUCCESS') ? '#27fb59' : '#ff1529',
          borderRadius: '4px'
        }}>
          <strong>Result:</strong> {healthStatus}
        </p>
      </div>

      {/* Test 2: Echo Test */}
      <div style={{ 
        border: '1px solid #ddd', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '15px'
      }}>
        <h3>Test 2: Echo Test (POST)</h3>
        <p>Tests if backend can receive and process data</p>
        <input
          type="text"
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
          placeholder="Enter message to send..."
        />
        <button 
          onClick={testEcho} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Testing...' : 'Test Echo'}
        </button>
        <p style={{ 
          marginTop: '10px', 
          padding: '10px', 
          background: echoResult.includes('SUCCESS') ? '#27fb59' : '#ff1529',
          borderRadius: '4px'
        }}>
          <strong>Result:</strong> {echoResult}
        </p>
      </div>

      {/* Run All Tests */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button 
          onClick={runAllTests} 
          disabled={loading}
          style={{
            padding: '15px 30px',
            background: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Running Tests...' : '🚀 Run All Tests'}
        </button>
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        background: '#002f50',
        borderRadius: '8px'
      }}>
        <h3>📋 Troubleshooting:</h3>
        <ul>
          <li>✅ Both tests show SUCCESS → Connection working perfectly!</li>
          <li>❌ "Network Error" → Backend not running (check Terminal 1)</li>
          <li>❌ "CORS Error" → Check Django CORS settings</li>
          <li>❌ "404 Not Found" → Check Django URLs configuration</li>
        </ul>
        <p><strong>Pro tip:</strong> Open browser DevTools (F12) → Network tab to see detailed request info</p>
      </div>
    </div>
  );
};

export default ConnectivityTest;