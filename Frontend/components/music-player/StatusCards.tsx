import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Wifi, WifiOff } from 'lucide-react';
import type { TimerState } from '@/types/music-player';
import { formatTime, formatTimeWithSeconds, getTimerElapsedTime } from '@/utils/music-player';

interface StatusCardsProps {
  isConnected: boolean;
  lastSyncTime: number;
  timerState: TimerState;
}

export const StatusCards: React.FC<StatusCardsProps> = ({
  isConnected,
  lastSyncTime,
  timerState,
}) => {
  const getConnectionStatus = () => {
    if (isConnected) {
      return (
        <Badge variant='default' className='bg-green-500'>
          <Wifi className='w-3 h-3 mr-1' />
          SSE Stream
        </Badge>
      );
    } else {
      return (
        <Badge variant='destructive'>
          <WifiOff className='w-3 h-3 mr-1' />
          Disconnected
        </Badge>
      );
    }
  };

  return (
    <>
      {/* Connection Status */}
      <Card className='bg-white/10 backdrop-blur border-white/20'>
        <CardContent className='p-4'>
          <h3 className='text-sm font-semibold text-white mb-3 flex items-center gap-2'>
            <Radio className='w-4 h-4' />
            Connection Status
          </h3>
          <div className='grid grid-cols-1 gap-3 text-xs text-purple-200'>
            <div className='flex items-center justify-between p-2 bg-white/5 rounded'>
              <span className='font-medium'>Connection Type:</span>
              <div className='flex items-center gap-2'>
                {getConnectionStatus()}
              </div>
            </div>
            <div className='flex items-center justify-between p-2 bg-white/5 rounded'>
              <span className='font-medium'>Data Method:</span>
              <span className='font-mono'>
                {isConnected 
                  ? 'Server-Sent Events' 
                  : 'Disconnected'}
              </span>
            </div>
            <div className='flex items-center justify-between p-2 bg-white/5 rounded'>
              <span className='font-medium'>Performance:</span>
              <span className={`font-mono ${
                isConnected ? 'text-green-300' : 'text-red-300'
              }`}>
                {isConnected ? '⚡ Real-time' : '❌ Offline'}
              </span>
            </div>
            <div className='flex items-center justify-between p-2 bg-white/5 rounded'>
              <span className='font-medium'>Last Update:</span>
              <span className='font-mono text-xs'>
                {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : '--:--:--'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timer Status Display */}
      <Card className='bg-white/10 backdrop-blur border-white/20'>
        <CardContent className='p-4'>
          <h3 className='text-sm font-semibold text-white mb-3'>
            Server Timer Status
          </h3>
          <div className='grid grid-cols-2 gap-3 text-xs text-purple-200'>
            <div>
              <span className='font-medium'>Timer ID:</span>
              <div className='font-mono'>{timerState.id || 'None'}</div>
            </div>
            <div>
              <span className='font-medium'>State:</span>
              <div>
                {timerState.isRunning
                  ? 'Running'
                  : timerState.isPaused
                    ? 'Paused'
                    : 'Stopped'}
              </div>
            </div>
            <div>
              <span className='font-medium'>Elapsed:</span>
              <div className='font-mono'>
                {formatTime(getTimerElapsedTime(timerState))}
              </div>
              <div className='text-xs opacity-75'>
                {formatTimeWithSeconds(getTimerElapsedTime(timerState)).totalSeconds}
              </div>
            </div>
            <div>
              <span className='font-medium'>Remaining:</span>
              <div className='font-mono'>
                {formatTime(timerState.remainingTime / 10)}
              </div>
              <div className='text-xs opacity-75'>
                {formatTimeWithSeconds(timerState.remainingTime / 10).totalSeconds}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Info */}
      <Card className='bg-white/10 backdrop-blur border-white/20'>
        <CardContent className='p-4'>
          <h3 className='text-sm font-semibold text-white mb-3'>
            How It Works
          </h3>
          <div className='text-xs text-purple-200 space-y-2'>
            <p>
              🎵 This player is synchronized with the master timer. All
              playback is controlled by the timer dashboard.
            </p>
            <p>
              ⚡ The player receives real-time updates via Server-Sent Events
              (SSE) for instant synchronization.
            </p>
            <p>
              🎯 Audio position automatically syncs with the timer's elapsed
              time for perfect coordination across multiple devices.
            </p>
            <p>
              🔊 You can only control the volume - play/pause is managed by
              the master timer.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}; 