import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Square } from 'lucide-react';
import type { TimerState } from '@/types/music-player';

interface ConnectionStatusProps {
  isConnected: boolean;
  timerState: TimerState;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  timerState,
}) => {
  const getConnectionStatus = () => {
    if (isConnected) {
      return (
        <Badge variant='default' className='bg-green-500'>
          <Zap className='w-3 h-3 mr-1' />
          SSE Stream
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
    <>
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
                {isConnected 
                  ? 'Real-time Server-Sent Events' 
                  : 'No connection established'}
              </p>
            </div>
            <div className='flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg border'>
              <span className='font-medium text-gray-600 dark:text-gray-400 mb-1'>Performance</span>
              <div className='text-lg font-bold'>
                {isConnected ? '⚡ Real-time' : '❌ Offline'}
              </div>
              <p className='text-xs text-gray-500 mt-1 text-center'>
                {isConnected 
                  ? 'Instant updates via SSE' 
                  : 'No timer updates'}
              </p>
            </div>
            <div className='flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg border'>
              <span className='font-medium text-gray-600 dark:text-gray-400 mb-1'>Browser Support</span>
              <div className='text-lg font-bold'>
                {isConnected ? '✅ Full' : '❌ None'}
              </div>
              <p className='text-xs text-gray-500 mt-1 text-center'>
                {isConnected 
                  ? 'SSE supported' 
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
              <span className='font-medium'>Connection:</span>{' '}
              {isConnected ? 'SSE' : 'Disconnected'}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}; 