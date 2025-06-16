import React, { useState } from 'react';
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
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
} from 'lucide-react';
import type { TimerState } from '@/types/music-player';
import { formatTime, getProgressPercentage } from '@/utils/timer-dashboard';

interface TimerDisplayProps {
  syncedTimerState: TimerState;
  timerState: TimerState;
  isConnected: boolean;
  isLoading: boolean;
  onStartTimer: (duration: string) => void;
  onStopTimer: () => void;
  onPauseTimer: () => void;
  onContinueTimer: () => void;
  onSetElapsedTime: (elapsedTime: string) => void;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  syncedTimerState,
  timerState,
  isConnected,
  isLoading,
  onStartTimer,
  onStopTimer,
  onPauseTimer,
  onContinueTimer,
  onSetElapsedTime,
}) => {
  const [inputDuration, setInputDuration] = useState('10.0');
  const [inputElapsedTime, setInputElapsedTime] = useState('0');

  const getStatusBadge = () => {
    if (syncedTimerState.isRunning && !syncedTimerState.isPaused) {
      return (
        <Badge className='bg-green-500'>
          <Play className='w-3 h-3 mr-1' />
          Running
        </Badge>
      );
    } else if (syncedTimerState.isPaused) {
      return (
        <Badge className='bg-yellow-500'>
          <Pause className='w-3 h-3 mr-1' />
          Paused
        </Badge>
      );
    } else {
      return (
        <Badge variant='secondary'>
          <Square className='w-3 h-3 mr-1' />
          Stopped
        </Badge>
      );
    }
  };

  return (
    <Card className='bg-white dark:bg-gray-800 shadow-lg'>
      <CardHeader className='text-center pb-4'>
        <CardTitle className='text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-2'>
          <Clock className='w-6 h-6 text-blue-600' />
          Master Timer
        </CardTitle>
        <CardDescription>
          High-precision timer for synchronized audio playback across
          multiple devices
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Timer Status */}
        <div className='text-center space-y-4'>
          <div className='flex justify-center'>
            {getStatusBadge()}
          </div>

          {/* Time Display */}
          <div className='bg-gray-50 dark:bg-gray-700 p-6 rounded-lg'>
            <div className='grid grid-cols-2 gap-4 text-center'>
              <div>
                <div className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                  Elapsed Time
                </div>
                <div className='text-xl font-mono font-bold text-green-600 dark:text-green-400'>
                  {formatTime(syncedTimerState.duration - syncedTimerState.remainingTime)}
                </div>
              </div>
              <div>
                <div className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
                  Remaining Time
                </div>
                <div className='text-xl font-mono font-bold text-red-600 dark:text-red-400'>
                  {formatTime(syncedTimerState.remainingTime)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className='mt-4'>
              <Progress
                value={getProgressPercentage(syncedTimerState.duration, syncedTimerState.remainingTime)}
                className='h-3 bg-gray-200 dark:bg-gray-600'
              />
              <div className='text-xs text-gray-500 dark:text-gray-400 mt-1 text-center'>
                {getProgressPercentage(syncedTimerState.duration, syncedTimerState.remainingTime).toFixed(1)}% Complete
              </div>
            </div>
          </div>
        </div>

        <Separator />

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
                onClick={() => onStartTimer(inputDuration)}
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
                onClick={() => onSetElapsedTime(inputElapsedTime)}
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
              onClick={onPauseTimer}
              disabled={isLoading || !timerState.isRunning || !isConnected}
              variant='secondary'
            >
              <Pause className='w-4 h-4 mr-2' />
              Pause Music
            </Button>

            <Button
              onClick={onContinueTimer}
              disabled={isLoading || !timerState.isPaused || !isConnected}
              className='bg-blue-600 hover:bg-blue-700'
            >
              <RotateCcw className='w-4 h-4 mr-2' />
              Resume Music
            </Button>

            <Button
              onClick={onStopTimer}
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
  );
}; 