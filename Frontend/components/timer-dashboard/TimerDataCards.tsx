import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { TimerState } from '@/types/music-player';
import { formatTime } from '@/utils/timer-dashboard';

interface TimerDataCardsProps {
  timerState: TimerState;
  syncedTimerState: TimerState;
}

export const TimerDataCards: React.FC<TimerDataCardsProps> = ({
  timerState,
  syncedTimerState,
}) => {
  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400'>
            Timer ID
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-blue-600'>
            {timerState.id ? timerState.id.slice(0, 8) : 'None'}
          </div>
          <p className='text-xs text-gray-500 mt-1'>Unique identifier</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400'>
            Total Duration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-green-600'>
            {formatTime(syncedTimerState.duration)}
          </div>
          <p className='text-xs text-gray-500 mt-1'>
            {syncedTimerState.durationSeconds}s total
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
  );
}; 