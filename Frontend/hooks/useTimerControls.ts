import { useState } from 'react';
import { API_CONFIG, getApiUrl } from '@/lib/config';
import { useToast } from '@/components/ui/use-toast';
import { validateDuration, validateElapsedTime } from '@/utils/timer-dashboard';
import type { TimerState } from '@/types/music-player';

interface UseTimerControlsProps {
  timerState: TimerState;
  isConnected: boolean;
}

export const useTimerControls = ({ timerState, isConnected }: UseTimerControlsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
  const startTimer = async (inputDuration: string) => {
    const validation = validateDuration(inputDuration);
    if (!validation.isValid) {
      toast({
        title: 'Invalid Duration',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    // Round to 1 second precision on client side for user feedback
    const roundedDuration = Math.round(validation.value!);

    try {
      await apiCall(getApiUrl(API_CONFIG.ENDPOINTS.TIMER.START), 'POST', { 
        duration: roundedDuration 
      });
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

  const setElapsedTime = async (inputElapsedTime: string) => {
    const validation = validateElapsedTime(inputElapsedTime);
    if (!validation.isValid) {
      toast({
        title: 'Invalid Elapsed Time',
        description: validation.error,
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
      await apiCall(getApiUrl(API_CONFIG.ENDPOINTS.TIMER.SET_ELAPSED), 'POST', { 
        elapsedTime: validation.value 
      });
      toast({
        title: 'Elapsed Time Set',
        description: `Elapsed time set to ${validation.value} seconds`,
      });
    } catch (error) {
      // Error already handled in apiCall
    }
  };

  return {
    isLoading,
    startTimer,
    stopTimer,
    pauseTimer,
    continueTimer,
    setElapsedTime,
  };
}; 