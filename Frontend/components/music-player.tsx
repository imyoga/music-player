'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Music, Upload, Radio, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { API_CONFIG, getApiUrl } from '@/lib/config';

interface Track {
  file: File;
  url: string;
  name: string;
  duration: number;
}

interface TimerState {
  id: string | null;
  duration: number; // in tenths of seconds
  remainingTime: number; // in tenths of seconds
  durationSeconds: number; // for display
  remainingSeconds: number; // for display
  isRunning: boolean;
  isPaused: boolean;
  timestamp: number;
  serverTime?: number; // server time when update was sent
  targetEndTime?: number | null; // when timer should end (null if not running)
  precision: number; // 0.1 for tenth of second precision
}

export default function MusicPlayer() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([1.0]);
  const [isLoading, setIsLoading] = useState(false);

  // Timer synchronization state
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
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentTrack = tracks[currentTrackIndex];

  // Connect to timer SSE stream for synchronization  
  useEffect(() => {
    const connectToTimerStream = () => {
      try {
        console.log('🔗 Music Player: Attempting SSE connection...');
        const eventSource = new EventSource(getApiUrl(API_CONFIG.ENDPOINTS.TIMER.STREAM));
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setIsConnected(true);
          console.log('✅ Music Player: Connected to timer stream');
        };

        eventSource.onmessage = event => {
          try {
            const data = JSON.parse(event.data);
            setTimerState(data);
            setLastSyncTime(Date.now());
          } catch (error) {
            console.error('❌ Music Player: Failed to parse timer data:', error);
          }
        };

        eventSource.onerror = error => {
          console.error('❌ Music Player: SSE connection error:', error);
          setIsConnected(false);

          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
              console.log('🔄 Music Player: Attempting to reconnect...');
              connectToTimerStream();
            }
          }, 3000);
        };
      } catch (error) {
        console.error('❌ Music Player: Failed to connect to stream:', error);
        setIsConnected(false);
        
        // Retry connection after 3 seconds
        setTimeout(() => {
          connectToTimerStream();
        }, 3000);
      }
    };

    connectToTimerStream();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Sync audio playback with timer state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || !isConnected) return;

    const elapsedTime = (timerState.duration - timerState.remainingTime) / 10; // Convert to seconds

    // Handle timer state changes
    if (timerState.isRunning && !timerState.isPaused) {
      // Timer is running - play audio and sync position
      if (!isPlaying) {
        setIsPlaying(true);
        // Use a promise-based approach with proper error handling
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Audio started successfully
              console.log('Audio playback started');
            })
            .catch((error: DOMException) => {
              // Handle play interruption gracefully
              if (error.name === 'AbortError') {
                console.log(
                  'Play request was interrupted, will retry on next sync'
                );
              } else if (error.name === 'NotAllowedError') {
                console.log(
                  'Autoplay blocked by browser, user interaction required'
                );
              } else {
                console.error('Audio play error:', error);
              }
              setIsPlaying(false);
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
      if (isPlaying) {
        setIsPlaying(false);
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
      if (isPlaying) {
        setIsPlaying(false);
        try {
          audio.pause();
          audio.currentTime = 0;
          setCurrentTime(0);
        } catch (error: unknown) {
          console.log(
            'Stop error:',
            error instanceof Error ? error.message : String(error)
          );
        }
      }
    }
  }, [timerState, currentTrack, isConnected]);

  // Initialize audio element and event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleEnded = () => {
      // In radio mode, don't auto-advance tracks
      // Let the timer control playback
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    const handleError = (event: Event) => {
      setIsLoading(false);
      setIsPlaying(false);
      const target = event.target as HTMLAudioElement;
      console.log(
        'Audio error (non-critical):',
        target?.error?.message || 'Unknown audio error'
      );
    };

    const handleLoadedData = () => {
      // Audio data is loaded and ready for playback
      setIsLoading(false);
    };

    const handleWaiting = () => {
      // Audio is waiting for more data
      console.log('Audio buffering...');
    };

    const handlePlaying = () => {
      // Audio has started playing
      setIsPlaying(true);
    };

    const handlePause = () => {
      // Audio has been paused
      if (!timerState.isRunning || timerState.isPaused) {
        setIsPlaying(false);
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
  }, [currentTrackIndex, timerState.isRunning, timerState.isPaused]);

  // Load new track when currentTrackIndex changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    setIsLoading(true);
    setCurrentTime(0);
    setDuration(0);

    // Stop current playback before loading new track
    if (!audio.paused) {
      audio.pause();
    }

    // Small delay to ensure previous operations complete
    setTimeout(() => {
      audio.src = currentTrack.url;
      audio.volume = volume[0];
      audio.load();
    }, 50);
  }, [currentTrack]);

  // Update volume when volume state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume[0];
  }, [volume]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      const newTrack = {
        file,
        url,
        name: file.name.replace(/\.[^/.]+$/, ''),
        duration: 0,
      };
      setTracks([newTrack]);
      setCurrentTrackIndex(0);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const selectTrack = (index: number) => {
    if (index !== currentTrackIndex) {
      setCurrentTrackIndex(index);
      // Reset playback state when changing tracks
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimeWithSeconds = (time: number) => {
    if (isNaN(time)) return { formatted: '0:00', totalSeconds: '0s' };
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    const totalSeconds = `${Math.floor(time)}s`;
    return { formatted, totalSeconds };
  };

  const getTimerElapsedTime = () => {
    return (timerState.duration - timerState.remainingTime) / 10;
  };

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

  const getPlaybackStatus = () => {
    if (!currentTrack) return 'No track loaded';
    if (isLoading) return 'Loading...';
    if (isPlaying) return 'Playing';
    if (timerState.isPaused) return 'Paused by timer';
    if (!timerState.isRunning) return 'Stopped by timer';
    return 'Ready';
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header */}
        <div className='text-center space-y-2'>
          <h1 className='text-4xl font-bold flex items-center justify-center gap-2'>
            <Radio className='w-8 h-8 text-purple-400' />
            Radio Music Player
          </h1>
          <p className='text-purple-200'>
            Synchronized with master timer • Real-time streaming
          </p>
          <div className='flex justify-center gap-2'>
            {getConnectionStatus()}
            <Badge
              variant='outline'
              className='bg-purple-700 text-purple-200 border-purple-500'
            >
              🎵 Timer Sync
            </Badge>
          </div>
        </div>

        {/* Main Player */}
        <Card className='bg-white/10 backdrop-blur border-white/20'>
          <CardContent className='p-6'>
            <div className='space-y-6'>
              {/* File Upload */}
              <div className='text-center'>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='audio/*'
                  onChange={handleFileSelect}
                  className='hidden'
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className='bg-purple-600 hover:bg-purple-700 text-white px-6 py-3'
                  size='lg'
                >
                  <Upload className='w-5 h-5 mr-2' />
                  Select Audio File
                </Button>
                <p className='text-sm text-purple-200 mt-2'>
                  Upload an audio file to sync with the master timer
                </p>
              </div>

              {/* Audio Player */}
              <audio ref={audioRef} />

              {/* Current Track Info */}
              {currentTrack && (
                <div className='bg-white/5 p-4 rounded-lg space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center'>
                        <Music className='w-6 h-6 text-white' />
                      </div>
                      <div>
                        <h3 className='font-semibold text-lg text-white'>
                          {currentTrack.name}
                        </h3>
                        <p className='text-purple-200 text-sm'>
                          Status: {getPlaybackStatus()}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm text-purple-200'>Duration</div>
                      <div className='font-mono text-white'>
                        {formatTime(duration)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm text-purple-200'>
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <div className='w-full bg-white/20 rounded-full h-2'>
                      <div
                        className='bg-purple-400 h-2 rounded-full transition-all duration-300'
                        style={{
                          width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                        }}
                      />
                    </div>
                  </div>

                  {/* Timer Sync Info */}
                  <div className='mt-4 p-3 bg-white/5 rounded-lg'>
                    <div className='text-sm text-purple-200 space-y-1'>
                      <div className='flex justify-between'>
                        <span>Timer Elapsed:</span>
                        <div className='text-right'>
                          <span className='font-mono'>
                            {formatTime(getTimerElapsedTime())}
                          </span>
                          <div className='text-xs opacity-75'>
                            {Math.floor(getTimerElapsedTime())}s total
                          </div>
                        </div>
                      </div>
                      <div className='flex justify-between'>
                        <span>Audio Position:</span>
                        <div className='text-right'>
                          <span className='font-mono'>
                            {formatTime(currentTime)}
                          </span>
                          <div className='text-xs opacity-75'>
                            {Math.floor(currentTime)}s
                          </div>
                        </div>
                      </div>
                      <div className='flex justify-between'>
                        <span>Sync Status:</span>
                        <span
                          className={`font-mono ${
                            Math.abs(currentTime - getTimerElapsedTime()) < 1
                              ? 'text-green-300'
                              : 'text-yellow-300'
                          }`}
                        >
                          {Math.abs(currentTime - getTimerElapsedTime()) < 1
                            ? 'In Sync'
                            : 'Syncing...'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Volume Control - Only user control available */}
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-purple-200'>Volume</span>
                      <span className='text-sm text-purple-200 font-mono'>
                        {Math.round(volume[0] * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={volume}
                      onValueChange={handleVolumeChange}
                      max={1}
                      min={0}
                      step={0.01}
                      className='w-full'
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Track List */}
        {tracks.length > 0 && (
          <Card className='bg-white/10 backdrop-blur border-white/20'>
            <CardContent className='p-6'>
              <h3 className='text-lg font-semibold text-white mb-4'>
                Current Track
              </h3>
              <div className='space-y-2'>
                {tracks.map((track, index) => (
                  <div
                    key={index}
                    onClick={() => selectTrack(index)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      index === currentTrackIndex
                        ? 'bg-purple-600/50 text-white'
                        : 'bg-white/5 text-purple-100 hover:bg-white/10'
                    }`}
                  >
                    <div className='flex items-center space-x-3'>
                      <div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0'>
                        <Radio className='w-4 h-4 text-white' />
                      </div>
                      <span className='truncate flex-1'>{track.name}</span>
                      {index === currentTrackIndex && isPlaying && (
                        <div className='flex space-x-1'>
                          <div className='w-1 h-4 bg-white rounded animate-pulse'></div>
                          <div className='w-1 h-4 bg-white rounded animate-pulse delay-75'></div>
                          <div className='w-1 h-4 bg-white rounded animate-pulse delay-150'></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                  {formatTime(getTimerElapsedTime())}
                </div>
                <div className='text-xs opacity-75'>
                  {formatTimeWithSeconds(getTimerElapsedTime()).totalSeconds}
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
      </div>
    </div>
  );
}
