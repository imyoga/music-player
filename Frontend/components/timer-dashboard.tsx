'use client';

import React from 'react';
import { useTimerDashboard } from '@/hooks/useTimerDashboard';
import { useTimerControls } from '@/hooks/useTimerControls';
import { DashboardHeader } from '@/components/timer-dashboard/DashboardHeader';
import { TimerDisplay } from '@/components/timer-dashboard/TimerDisplay';
import { TimerDataCards } from '@/components/timer-dashboard/TimerDataCards';
import { ConnectionStatus } from '@/components/timer-dashboard/ConnectionStatus';

export default function TimerDashboard() {
  // Use custom hooks for timer functionality
  const { timerState, syncedTimerState, isConnected } = useTimerDashboard();
  const {
    isLoading,
    startTimer,
    stopTimer,
    pauseTimer,
    continueTimer,
    setElapsedTime,
  } = useTimerControls({ timerState, isConnected });

  return (
    <div className='dark min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header */}
        <DashboardHeader isConnected={isConnected} />

        {/* Main Timer Display */}
        <TimerDisplay
          syncedTimerState={syncedTimerState}
          timerState={timerState}
          isConnected={isConnected}
          isLoading={isLoading}
          onStartTimer={startTimer}
          onStopTimer={stopTimer}
          onPauseTimer={pauseTimer}
          onContinueTimer={continueTimer}
          onSetElapsedTime={setElapsedTime}
        />

        {/* Timer Data Points */}
        <TimerDataCards 
          timerState={timerState}
          syncedTimerState={syncedTimerState}
        />

        {/* Connection Status & Debug */}
        <ConnectionStatus 
          isConnected={isConnected}
          timerState={timerState}
        />
      </div>
    </div>
  );
}
