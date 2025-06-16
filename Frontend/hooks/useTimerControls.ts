import { useState } from 'react';
import { API_CONFIG, getApiUrl } from '@/lib/config';
import { useToast } from '@/components/ui/use-toast';
import { validateDuration, validateElapsedTime } from '@/utils/timer-dashboard';
import type { TimerState } from '@/types/music-player';

interface UseTimerControlsProps {
  timerState: TimerState;
  isConnected: boolean;
  accessCode: string | null;
}

export const useTimerControls = ({ timerState, isConnected, accessCode }: UseTimerControlsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // API call helper
  const apiCall = async (
    endpoint: string,
    method: string = 'GET',
    body?: any
  ) => {
    if (!accessCode) {
      throw new Error('Access code is required');
    }

    const requestBody = body ? { ...body, accessCode } : { accessCode };
    
    console.log('📤 API Call:', {
      endpoint,
      method,
      accessCode,
      headers: {
        'Content-Type': 'application/json',
        'x-access-code': accessCode,
      },
      body: requestBody
    });

    setIsLoading(true);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-access-code': accessCode,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();
      console.log('📋 Response Data:', data);

      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('❌ API call failed:', error);
      
      // Handle different types of errors
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Test API connection
  const testConnection = async () => {
    try {
      console.log('🔍 Testing API connection...');
      const testUrl = getApiUrl('/api/timer/active');
      console.log('🎯 Test URL:', testUrl);
      
      const response = await fetch(testUrl);
      console.log('📡 Test Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API is reachable:', data);
        return true;
      } else {
        console.log('❌ API returned error status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      return false;
    }
  };

  // Timer control functions
  const startTimer = async (inputDuration: string) => {
    console.log('🎯 StartTimer called:', { inputDuration, accessCode });

    // Test connection first
    const connectionOk = await testConnection();
    if (!connectionOk) {
      toast({
        title: 'Connection Error',
        description: 'Cannot connect to the server. Please check if the backend is running.',
        variant: 'destructive',
      });
      return;
    }

    if (!accessCode) {
      toast({
        title: 'Access Code Required',
        description: 'Please enter an access code first',
        variant: 'destructive',
      });
      return;
    }

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
    console.log('✅ Duration validated and rounded:', roundedDuration);

    try {
      const result = await apiCall(getApiUrl(API_CONFIG.ENDPOINTS.TIMER.START), 'POST', { 
        duration: roundedDuration 
      });
      console.log('🎉 Timer started successfully:', result);
      
      toast({
        title: 'Timer Started',
        description: `Timer started for ${roundedDuration} seconds (1s precision)`,
      });
    } catch (error) {
      console.error('❌ Failed to start timer:', error);
      // Error already handled in apiCall
    }
  };

  const stopTimer = async () => {
    if (!accessCode) {
      toast({
        title: 'Access Code Required',
        description: 'Please enter an access code first',
        variant: 'destructive',
      });
      return;
    }

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
    if (!accessCode) {
      toast({
        title: 'Access Code Required',
        description: 'Please enter an access code first',
        variant: 'destructive',
      });
      return;
    }

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
    if (!accessCode) {
      toast({
        title: 'Access Code Required',
        description: 'Please enter an access code first',
        variant: 'destructive',
      });
      return;
    }

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
    if (!accessCode) {
      toast({
        title: 'Access Code Required',
        description: 'Please enter an access code first',
        variant: 'destructive',
      });
      return;
    }

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