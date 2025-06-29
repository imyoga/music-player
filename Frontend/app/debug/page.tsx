'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function DebugPage() {
  const [accessCode, setAccessCode] = useState('123456');
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev.slice(-19), `${timestamp}: ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  const connectToStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const streamUrl = `/api/stream?accessCode=${accessCode}`;
    
    addLog(`🔗 Attempting to connect to: ${streamUrl}`);
    addLog(`🔧 Window location: ${window.location.href}`);
    
    setConnectionAttempts(prev => prev + 1);

    try {
      const eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = (event) => {
        setIsConnected(true);
        addLog(`✅ SSE connection opened successfully`);
        addLog(`✅ ReadyState: ${eventSource.readyState}`);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          addLog(`📨 Received message: ${data.remainingSeconds}s remaining`);
        } catch (error) {
          addLog(`❌ Failed to parse message: ${error}`);
        }
      };

      eventSource.onerror = (error) => {
        setIsConnected(false);
        addLog(`❌ SSE error occurred`);
        addLog(`❌ ReadyState: ${eventSource.readyState}`);
        addLog(`❌ Error: ${JSON.stringify(error)}`);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          addLog(`❌ Connection closed by server`);
        }
      };

    } catch (error) {
      addLog(`❌ Failed to create EventSource: ${error}`);
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    addLog(`🔌 Disconnected from stream`);
  };

  const startTestTimer = async () => {
    try {
      const response = await fetch('/api/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessCode: accessCode,
          duration: 30
        }),
      });
      
      const data = await response.json();
      addLog(`🚀 Started test timer: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`❌ Failed to start timer: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">🔧 SSE Connection Debug Tool</h1>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Access Code"
                className="border px-3 py-2 rounded w-32"
              />
              <button 
                onClick={connectToStream} 
                disabled={isConnected}
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
              >
                Connect to Stream
              </button>
              <button 
                onClick={disconnect} 
                disabled={!isConnected}
                className="bg-red-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
              >
                Disconnect
              </button>
              <button 
                onClick={startTestTimer}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Start Test Timer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-bold mb-2">Connection Status</h3>
                <div className="space-y-1 text-sm">
                  <div>Status: <span style={{color: isConnected ? 'green' : 'red'}}>
                    {isConnected ? '✅ Connected' : '❌ Disconnected'}
                  </span></div>
                  <div>Attempts: {connectionAttempts}</div>
                  <div>Access Code: {accessCode}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-bold mb-2">Last Message</h3>
                <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
                  {lastMessage ? JSON.stringify(lastMessage, null, 2) : 'No messages received'}
                </pre>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">Debug Logs</h3>
                <button 
                  onClick={clearLogs}
                  className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
                >
                  Clear Logs
                </button>
              </div>
              <div className="bg-black text-green-400 p-4 rounded text-xs font-mono max-h-64 overflow-auto">
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
                {logs.length === 0 && <div>No logs yet...</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 