import { useState, useRef, useEffect } from 'react';
import type { Track, TimerState, AudioPlayerState } from '@/types/music-player';
import { getTimerElapsedTime } from '@/utils/music-player';

interface UseAudioPlayerProps {
  tracks: Track[];
  timerState: TimerState;
  isConnected: boolean;
}

export const useAudioPlayer = ({ tracks, timerState, isConnected }: UseAudioPlayerProps) => {
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: [1.0],
    isLoading: false,
    currentTrackIndex: 0,
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentTrack = tracks[playerState.currentTrackIndex];

  // Sync audio playback with timer state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || !isConnected) return;

    const elapsedTime = getTimerElapsedTime(timerState);

    // Handle timer state changes
    if (timerState.isRunning && !timerState.isPaused) {
      // Timer is running - play audio and sync position
      if (!playerState.isPlaying) {
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
        // Use a promise-based approach with proper error handling
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Audio playback started');
            })
            .catch((error: DOMException) => {
              // Handle play interruption gracefully
              if (error.name === 'AbortError') {
                console.log('Play request was interrupted, will retry on next sync');
              } else if (error.name === 'NotAllowedError') {
                console.log('Autoplay blocked by browser, user interaction required');
              } else {
                console.error('Audio play error:', error);
              }
              setPlayerState(prev => ({ ...prev, isPlaying: false }));
            });
        }
      }

      // Sync audio position with timer elapsed time
      const timeDiff = Math.abs(audio.currentTime - elapsedTime);
      if (timeDiff > 1.5) {
        // Only sync if difference is significant (1.5s)
        // Check if audio is ready for seeking
        if (audio.readyState >= 2) {
          // HAVE_CURRENT_DATA or higher
          try {
            audio.currentTime = Math.min(elapsedTime, audio.duration || 0);
            console.log(`Syncing audio to timer: ${elapsedTime.toFixed(1)}s`);
          } catch (error: unknown) {
            console.log(
              'Seek error (will retry):',
              error instanceof Error ? error.message : String(error)
            );
          }
        }
      }
    } else if (timerState.isPaused) {
      // Timer is paused - pause audio
      if (playerState.isPlaying) {
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
        try {
          audio.pause();
        } catch (error: unknown) {
          console.log(
            'Pause error:',
            error instanceof Error ? error.message : String(error)
          );
        }
      }
    } else {
      // Timer is stopped - stop audio and reset
      if (playerState.isPlaying) {
        setPlayerState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          currentTime: 0 
        }));
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (error: unknown) {
          console.log(
            'Stop error:',
            error instanceof Error ? error.message : String(error)
          );
        }
      }
    }
  }, [timerState, currentTrack, isConnected, playerState.isPlaying]);

  // Initialize audio element and event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setPlayerState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleLoadedMetadata = () => {
      setPlayerState(prev => ({ 
        ...prev, 
        duration: audio.duration, 
        isLoading: false 
      }));
    };

    const handleCanPlay = () => {
      setPlayerState(prev => ({ ...prev, isLoading: false }));
    };

    const handleLoadStart = () => {
      setPlayerState(prev => ({ ...prev, isLoading: true }));
    };

    const handleEnded = () => {
      // In radio mode, don't auto-advance tracks
      // Let the timer control playback
      setPlayerState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        currentTime: 0 
      }));
      audio.currentTime = 0;
    };

    const handleError = (event: Event) => {
      setPlayerState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isPlaying: false 
      }));
      const target = event.target as HTMLAudioElement;
      console.log(
        'Audio error (non-critical):',
        target?.error?.message || 'Unknown audio error'
      );
    };

    const handleLoadedData = () => {
      setPlayerState(prev => ({ ...prev, isLoading: false }));
    };

    const handleWaiting = () => {
      console.log('Audio buffering...');
    };

    const handlePlaying = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      if (!timerState.isRunning || timerState.isPaused) {
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
    };
  }, [playerState.currentTrackIndex, timerState.isRunning, timerState.isPaused]);

  // Load new track when currentTrackIndex changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    setPlayerState(prev => ({ 
      ...prev, 
      isLoading: true, 
      currentTime: 0, 
      duration: 0 
    }));

    // Stop current playback before loading new track
    if (!audio.paused) {
      audio.pause();
    }

    // Small delay to ensure previous operations complete
    setTimeout(() => {
      audio.src = currentTrack.url;
      audio.volume = playerState.volume[0];
      audio.load();
    }, 50);
  }, [currentTrack]);

  // Update volume when volume state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = playerState.volume[0];
  }, [playerState.volume]);

  const selectTrack = (index: number) => {
    if (index !== playerState.currentTrackIndex) {
      setPlayerState(prev => ({
        ...prev,
        currentTrackIndex: index,
        isPlaying: false,
        currentTime: 0,
      }));
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setPlayerState(prev => ({ ...prev, volume: value }));
  };

  const getPlaybackStatus = () => {
    if (!currentTrack) return 'No track loaded';
    if (playerState.isLoading) return 'Loading...';
    if (playerState.isPlaying) return 'Playing';
    if (timerState.isPaused) return 'Paused by timer';
    if (!timerState.isRunning) return 'Stopped by timer';
    return 'Ready';
  };

  return {
    playerState,
    audioRef,
    currentTrack,
    selectTrack,
    handleVolumeChange,
    getPlaybackStatus,
  };
}; 