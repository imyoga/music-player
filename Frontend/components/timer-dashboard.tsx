'use client';

import React, { useState } from 'react';
import { AccessCodeInput } from '@/components/AccessCodeInput';
import { useTimerDashboard } from '@/hooks/useTimerDashboard';
import { useTimerControls } from '@/hooks/useTimerControls';
import { DashboardHeader } from '@/components/timer-dashboard/DashboardHeader';
import { TimerDisplay } from '@/components/timer-dashboard/TimerDisplay';
import { TimerDataCards } from '@/components/timer-dashboard/TimerDataCards';
import { ConnectionStatus } from '@/components/timer-dashboard/ConnectionStatus';

export default function TimerDashboard() {
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Use custom hooks for timer functionality (only if access code is set)
  const { timerState, syncedTimerState, isConnected } = useTimerDashboard(accessCode);
  const {
    isLoading,
    startTimer,
    stopTimer,
    pauseTimer,
    continueTimer,
    setElapsedTime,
  } = useTimerControls({ timerState, isConnected, accessCode });

  const handleAccessCodeSubmit = async (code: string) => {
    setIsConnecting(true);
    try {
      // Set access code - the hooks will automatically connect with this code
      setAccessCode(code);
    } catch (error) {
      console.error('Failed to connect with access code:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleChangeAccessCode = () => {
    setAccessCode(null);
  };

  // Show access code input if no access code is set
  if (!accessCode) {
    return (
      <AccessCodeInput
        onAccessCodeSubmit={handleAccessCodeSubmit}
        isLoading={isConnecting}
        title="Timer Dashboard Access"
        description="Enter your access code to access the timer dashboard and control timers"
      />
    );
  }

  return (
    <div className='dark min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header */}
        <DashboardHeader 
          isConnected={isConnected} 
          accessCode={accessCode}
          onChangeAccessCode={handleChangeAccessCode}
        />

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
          accessCode={accessCode}
        />
      </div>
    </div>
  );
}
