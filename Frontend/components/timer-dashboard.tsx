'use client';

import { useState, useEffect, useRef } from 'react';
import { API_CONFIG, getApiUrl } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  Timer as TimerIcon,
  Activity,
  Zap,
} from 'lucide-react';

interface TimerState {
  id: string | null;
  duration: number; // in tenths of seconds
  remainingTime: number; // in tenths of seconds
  durationSeconds: number; // for display
  remainingSeconds: number; // for display
  isRunning: boolean;
  isPaused: boolean;
  timestamp: number;
  precision: number; // 0.1 for tenth of second precision
}

export default function TimerDashboard() {
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

  const [inputDuration, setInputDuration] = useState('10.0');
  const [inputElapsedTime, setInputElapsedTime] = useState('0');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'stream' | 'polling' | 'none'>('none');
  const [isLoading, setIsLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();

  // Connect to SSE stream for real-time updates
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    const connectToStream = () => {
      try {
        const streamUrl = getApiUrl(API_CONFIG.ENDPOINTS.TIMER.STREAM);
        console.log('🔗 Attempting to connect to SSE stream at:', streamUrl);
        console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
        console.log('🔧 BASE_URL:', API_CONFIG.BASE_URL);
        
        // Clear any existing connection first
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        const eventSource = new EventSource(streamUrl);
        eventSourceRef.current = eventSource;

        // Set a timeout to fallback to polling if EventSource fails
        const connectionTimeout = setTimeout(() => {
          if (!isConnected) {
            console.warn('⚠️ EventSource connection timeout, falling back to polling...');
            eventSource.close();
            startPolling();
          }
        }, 5000); // 5 second timeout

        eventSource.onopen = () => {
          clearTimeout(connectionTimeout);
          setIsConnected(true);
          setConnectionMethod('stream');
          console.log('✅ Connected to timer stream');
        };

        eventSource.onmessage = event => {
          try {
            const data = JSON.parse(event.data);
            // console.log('📨 Timer update received:', data);
            setTimerState(data);
          } catch (error) {
            console.error('❌ Failed to parse timer data:', error);
          }
        };

        eventSource.onerror = error => {
          clearTimeout(connectionTimeout);
          console.error('❌ SSE connection error:', error);
          console.log('📊 EventSource readyState:', eventSource.readyState);
          console.log('📊 EventSource CONNECTING:', EventSource.CONNECTING);
          console.log('📊 EventSource OPEN:', EventSource.OPEN);
          console.log('📊 EventSource CLOSED:', EventSource.CLOSED);
          setIsConnected(false);
          setConnectionMethod('none');

          // Fallback to polling immediately on error
          if (eventSource.readyState === EventSource.CLOSED) {
            console.log('🔄 EventSource closed, falling back to polling...');
            startPolling();
          } else {
            // Reconnect after 3 seconds if not closed
            setTimeout(() => {
              if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
                console.log('🔄 Attempting to reconnect to timer stream...');
                connectToStream();
              }
            }, 3000);
          }
        };
      } catch (error) {
        console.error('❌ Failed to connect to stream:', error);
        setIsConnected(false);
        setConnectionMethod('none');
        startPolling();
      }
    };

    // Fallback polling mechanism
    const startPolling = () => {
      console.log('🔁 Starting polling fallback...');
      setIsConnected(false); // Mark as not connected to SSE
      setConnectionMethod('polling');
      
      // Clear any existing interval
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      
      // Poll every 1 second
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.TIMER.STATUS));
          const data = await response.json();
          setTimerState(data.timer);
        } catch (error) {
          console.error('❌ Polling failed:', error);
        }
      }, 1000);
    };

    connectToStream();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isConnected]);

  // API call helper
  const apiCall = async (
    endpoint: string,
    method: string = 'GET',
    body?: any
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API call failed:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Timer control functions
  const startTimer = async () => {
    const duration = parseFloat(inputDuration);
    if (!duration || duration <= 0) {
      toast({
        title: 'Invalid Duration',
        description:
          'Please enter a positive number of seconds (decimals allowed)',
        variant: 'destructive',
      });
      return;
    }

    // Round to 1 second precision on client side for user feedback
    const roundedDuration = Math.round(duration);

    try {
      await apiCall(getApiUrl(API_CONFIG.ENDPOINTS.TIMER.START), 'POST', { duration: roundedDuration });
      toast({
        title: 'Timer Started',
        description: `Timer started for ${roundedDuration} seconds (1s precision)`,
      });
    } catch (error) {
      // Error already handled in apiCall
    }
  };

  const stopTimer = async () => {
    try {
      await apiCall(getApiUrl(API_CONFIG.ENDPOINTS.TIMER.STOP), 'POST');
      toast({
        title: 'Timer Stopped',
        description: 'Timer has been stopped and reset',
      });
    } catch (error) {
      // Error already handled in apiCall
    }
  };

  const pauseTimer = async () => {
    try {
      await apiCall(getApiUrl(API_CONFIG.ENDPOINTS.TIMER.PAUSE), 'POST');
      toast({
        title: 'Timer Paused',
        description: 'Timer has been paused',
      });
    } catch (error) {
      // Error already handled in apiCall
    }
  };

  const continueTimer = async () => {
    try {
      await apiCall(getApiUrl(API_CONFIG.ENDPOINTS.TIMER.CONTINUE), 'POST');
      toast({
        title: 'Timer Resumed',
        description: 'Timer has been resumed',
      });
    } catch (error) {
      // Error already handled in apiCall
    }
  };

  const setElapsedTime = async () => {
    const elapsedTime = parseFloat(inputElapsedTime);
    if (isNaN(elapsedTime) || elapsedTime < 0) {
      toast({
        title: 'Invalid Elapsed Time',
        description: 'Please enter a valid non-negative number of seconds',
        variant: 'destructive',
      });
      return;
    }

    if (!timerState.id) {
      toast({
        title: 'No Active Timer',
        description: 'Please start a timer first before setting elapsed time',
        variant: 'destructive',
      });
      return;
    }

    try {
      await apiCall(getApiUrl(API_CONFIG.ENDPOINTS.TIMER.SET_ELAPSED), 'POST', { elapsedTime });
      toast({
        title: 'Elapsed Time Set',
        description: `Elapsed time set to ${elapsedTime} seconds`,
      });
    } catch (error) {
      // Error already handled in apiCall
    }
  };

  // Helper functions
  const formatTime = (tenthsOfSeconds: number): string => {
    const totalSeconds = tenthsOfSeconds / 10;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    const tenths = Math.floor(tenthsOfSeconds % 10);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}.${tenths}`;
  };

  const getProgressPercentage = (): number => {
    if (timerState.duration === 0) return 0;
    return (
      ((timerState.duration - timerState.remainingTime) / timerState.duration) *
      100
    );
  };

  const getStatusBadge = () => {
    if (timerState.isRunning) {
      return (
        <Badge variant='default' className='bg-green-500'>
          <Activity className='w-3 h-3 mr-1' />
          Running
        </Badge>
      );
    } else if (timerState.isPaused) {
      return (
        <Badge variant='secondary'>
          <Pause className='w-3 h-3 mr-1' />
          Paused
        </Badge>
      );
    } else if (timerState.remainingTime === 0 && timerState.duration > 0) {
      return (
        <Badge variant='destructive'>
          <Zap className='w-3 h-3 mr-1' />
          Finished
        </Badge>
      );
    } else {
      return (
        <Badge variant='outline'>
          <Square className='w-3 h-3 mr-1' />
          Stopped
        </Badge>
      );
    }
  };

  const getConnectionStatus = () => {
    if (connectionMethod === 'stream') {
      return (
        <Badge variant='default' className='bg-green-500'>
          <Zap className='w-3 h-3 mr-1' />
          SSE Stream
        </Badge>
      );
    } else if (connectionMethod === 'polling') {
      return (
        <Badge variant='secondary' className='bg-orange-500 text-white'>
          <Activity className='w-3 h-3 mr-1' />
          Polling Fallback
        </Badge>
      );
    } else {
      return (
        <Badge variant='destructive'>
          <Square className='w-3 h-3 mr-1' />
          Disconnected
        </Badge>
      );
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header */}
        <div className='text-center space-y-2'>
          <h1 className='text-4xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-2'>
            <TimerIcon className='w-8 h-8 text-blue-600' />
            Radio Control Center
          </h1>
          <p className='text-gray-600 dark:text-gray-300'>
            Master timer controlling synchronized music players
          </p>
          <div className='flex justify-center gap-2'>
            {getConnectionStatus()}
            <Badge
              variant='outline'
              className='bg-purple-100 dark:bg-purple-900'
            >
              🎵 Music Sync Active
            </Badge>
          </div>
        </div>

        {/* Main Timer Display */}
        <Card className='border-2 shadow-lg'>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl flex items-center justify-center gap-2'>
              <Clock className='w-6 h-6' />
              Current Timer
            </CardTitle>
            <CardDescription>
              {timerState.id ? `Timer ID: ${timerState.id}` : 'No active timer'}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Timer Display */}
            <div className='text-center space-y-4'>
              <div className='text-6xl font-mono font-bold text-blue-600 dark:text-blue-400'>
                {formatTime(timerState.remainingTime)}
              </div>

              {/* Seconds Display */}
              <div className='text-2xl font-mono text-gray-600 dark:text-gray-400'>
                {(timerState.remainingTime / 10).toFixed(1)} seconds remaining
              </div>

              {/* Progress Bar */}
              <div className='space-y-2'>
                <Progress value={getProgressPercentage()} className='h-3' />
                <div className='text-sm text-gray-600 dark:text-gray-400'>
                  {timerState.duration > 0 && (
                    <>
                      Progress: {Math.round(getProgressPercentage())}% •
                      Precision: {timerState.precision}s
                    </>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className='flex justify-center'>{getStatusBadge()}</div>
            </div>

            <Separator />

            {/* Controls */}
            <div className='space-y-4'>
              {/* Duration Input */}
              <div className='flex flex-col space-y-2'>
                <Label htmlFor='duration'>
                  Music Playback Duration (seconds)
                </Label>
                <div className='flex gap-2'>
                  <Input
                    id='duration'
                    type='number'
                    value={inputDuration}
                    onChange={e => setInputDuration(e.target.value)}
                    placeholder='Enter seconds (e.g., 30.5)'
                    min='0.1'
                    step='0.1'
                    className='flex-1'
                  />
                  <Button
                    onClick={startTimer}
                    disabled={isLoading || !isConnected}
                    className='bg-green-600 hover:bg-green-700'
                  >
                    <Play className='w-4 h-4 mr-2' />
                    Start Music
                  </Button>
                </div>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  ⚡ All connected music players will sync to this timer
                </p>
              </div>

              {/* Set Elapsed Time */}
              <div className='flex flex-col space-y-2'>
                <Label htmlFor='elapsedTime'>
                  Set Elapsed Time (Jump to Position)
                </Label>
                <div className='flex gap-2'>
                  <Input
                    id='elapsedTime'
                    type='number'
                    value={inputElapsedTime}
                    onChange={e => setInputElapsedTime(e.target.value)}
                    placeholder='Enter elapsed seconds (e.g., 20)'
                    min='0'
                    step='1'
                    className='flex-1'
                    disabled={!timerState.id}
                  />
                  <Button
                    onClick={setElapsedTime}
                    disabled={isLoading || !isConnected || !timerState.id}
                    className='bg-orange-600 hover:bg-orange-700'
                  >
                    <Clock className='w-4 h-4 mr-2' />
                    Set Position
                  </Button>
                </div>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  🎯 Jump to any position in the current timer (remaining time
                  will adjust automatically)
                </p>
              </div>

              {/* Action Buttons */}
              <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
                <Button
                  onClick={pauseTimer}
                  disabled={isLoading || !timerState.isRunning || !isConnected}
                  variant='secondary'
                >
                  <Pause className='w-4 h-4 mr-2' />
                  Pause Music
                </Button>

                <Button
                  onClick={continueTimer}
                  disabled={isLoading || !timerState.isPaused || !isConnected}
                  className='bg-blue-600 hover:bg-blue-700'
                >
                  <RotateCcw className='w-4 h-4 mr-2' />
                  Resume Music
                </Button>

                <Button
                  onClick={stopTimer}
                  disabled={
                    isLoading ||
                    (!timerState.isRunning && !timerState.isPaused) ||
                    !isConnected
                  }
                  variant='destructive'
                  className='sm:col-span-1 col-span-2'
                >
                  <Square className='w-4 h-4 mr-2' />
                  Stop Music
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timer Data Points */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                Total Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {formatTime(timerState.duration)}
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                {(timerState.duration / 10).toFixed(1)} seconds
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                Remaining Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-blue-600'>
                {formatTime(timerState.remainingTime)}
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                {(timerState.remainingTime / 10).toFixed(1)} seconds left
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                Elapsed Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-600'>
                {formatTime(timerState.duration - timerState.remainingTime)}
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                {(
                  (timerState.duration - timerState.remainingTime) /
                  10
                ).toFixed(1)}{' '}
                seconds passed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                Update Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-purple-600'>
                {timerState.precision ? `${timerState.precision}s` : '1.0s'}
              </div>
              <p className='text-xs text-gray-500 mt-1'>High precision timer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                Last Update
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-orange-600'>
                {timerState.timestamp
                  ? new Date(timerState.timestamp).toLocaleTimeString()
                  : '--:--:--'}
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                Real-time system clock
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Connection Status Details */}
        <Card className='bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'>
          <CardHeader>
            <CardTitle className='text-sm flex items-center gap-2'>
              <Activity className='w-4 h-4' />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
              <div className='flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg border'>
                <span className='font-medium text-gray-600 dark:text-gray-400 mb-1'>Connection Type</span>
                <div className='flex items-center gap-2'>
                  {getConnectionStatus()}
                </div>
                <p className='text-xs text-gray-500 mt-1 text-center'>
                  {connectionMethod === 'stream' 
                    ? 'Real-time Server-Sent Events' 
                    : connectionMethod === 'polling' 
                    ? 'HTTP Polling Fallback (1s interval)'
                    : 'No connection established'}
                </p>
              </div>
              <div className='flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg border'>
                <span className='font-medium text-gray-600 dark:text-gray-400 mb-1'>Performance</span>
                <div className='text-lg font-bold'>
                  {connectionMethod === 'stream' ? '⚡ Real-time' : 
                   connectionMethod === 'polling' ? '🔄 1s Delay' : '❌ Offline'}
                </div>
                <p className='text-xs text-gray-500 mt-1 text-center'>
                  {connectionMethod === 'stream' 
                    ? 'Instant updates via SSE' 
                    : connectionMethod === 'polling' 
                    ? 'Updates every second'
                    : 'No timer updates'}
                </p>
              </div>
              <div className='flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg border'>
                <span className='font-medium text-gray-600 dark:text-gray-400 mb-1'>Browser Support</span>
                <div className='text-lg font-bold'>
                  {connectionMethod === 'stream' ? '✅ Full' : 
                   connectionMethod === 'polling' ? '⚠️ Limited' : '❌ None'}
                </div>
                <p className='text-xs text-gray-500 mt-1 text-center'>
                  {connectionMethod === 'stream' 
                    ? 'SSE supported' 
                    : connectionMethod === 'polling' 
                    ? 'SSE blocked, using fallback'
                    : 'Connection failed'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card className='bg-gray-50 dark:bg-gray-800/50'>
          <CardHeader>
            <CardTitle className='text-sm'>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='font-medium'>Timer ID:</span>{' '}
                {timerState.id || 'None'}
              </div>
              <div>
                <span className='font-medium'>Is Running:</span>{' '}
                {timerState.isRunning.toString()}
              </div>
              <div>
                <span className='font-medium'>Is Paused:</span>{' '}
                {timerState.isPaused.toString()}
              </div>
              <div>
                <span className='font-medium'>Connection Method:</span>{' '}
                {connectionMethod}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
