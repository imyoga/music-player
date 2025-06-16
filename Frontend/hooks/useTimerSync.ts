import { useState, useRef, useEffect } from 'react';
import { API_CONFIG, getApiUrl } from '@/lib/config';
import type { TimerState } from '@/types/music-player';

export const useTimerSync = (accessCode: string | null) => {
  const [timerState, setTimerState] = useState<TimerState>({
    id: null,
    duration: 0,
    remainingTime: 0,
    durationSeconds: 0,
    remainingSeconds: 0,
    isRunning: false,
    isPaused: false,
    timestamp: 0,
    precision: 0.1,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Only connect if we have an access code
    if (!accessCode) {
      setIsConnected(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const connectToTimerStream = () => {
      try {
        console.log('🔗 Music Player: Attempting SSE connection with access code:', accessCode);
        const streamUrl = getApiUrl(API_CONFIG.ENDPOINTS.TIMER.STREAM) + `?accessCode=${accessCode}`;
        const eventSource = new EventSource(streamUrl);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setIsConnected(true);
          console.log('✅ Music Player: Connected to timer stream for access code:', accessCode);
        };

        eventSource.onmessage = event => {
          try {
            const data = JSON.parse(event.data);
            setTimerState(data);
            setLastSyncTime(Date.now());
          } catch (error) {
            console.error('❌ Music Player: Failed to parse timer data:', error);
          }
        };

        eventSource.onerror = error => {
          console.error('❌ Music Player: SSE connection error:', error);
          setIsConnected(false);

          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
              console.log('🔄 Music Player: Attempting to reconnect...');
              connectToTimerStream();
            }
          }, 3000);
        };
      } catch (error) {
        console.error('❌ Music Player: Failed to connect to stream:', error);
        setIsConnected(false);
        
        // Retry connection after 3 seconds
        setTimeout(() => {
          connectToTimerStream();
        }, 3000);
      }
    };

    connectToTimerStream();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [accessCode]); // Re-connect when access code changes

  return {
    timerState,
    isConnected,
    lastSyncTime,
  };
}; 