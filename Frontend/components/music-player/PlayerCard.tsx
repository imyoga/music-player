import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Upload, Music } from 'lucide-react';
import type { Track, TimerState, AudioPlayerState } from '@/types/music-player';
import { formatTime, getTimerElapsedTime } from '@/utils/music-player';

interface PlayerCardProps {
  currentTrack: Track | undefined;
  playerState: AudioPlayerState;
  timerState: TimerState;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onVolumeChange: (value: number[]) => void;
  getPlaybackStatus: () => string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  currentTrack,
  playerState,
  timerState,
  audioRef,
  onFileSelect,
  onVolumeChange,
  getPlaybackStatus,
  fileInputRef,
}) => {
  return (
    <Card className='bg-white/10 backdrop-blur border-white/20'>
      <CardContent className='p-6'>
        <div className='space-y-6'>
          {/* File Upload */}
          <div className='text-center'>
            <input
              ref={fileInputRef}
              type='file'
              accept='audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.wma,.opus,.webm,.3gp,.3g2,.amr,.awb,.mp4,.mov,.avi,.mkv,.webm,.ogv,.m4v'
              onChange={onFileSelect}
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
              Upload an audio file (MP3, WAV, M4A, AAC, FLAC, OGG, etc.) to sync with the master timer
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
                    {formatTime(playerState.duration)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className='space-y-2'>
                <div className='flex justify-between text-sm text-purple-200'>
                  <span>{formatTime(playerState.currentTime)}</span>
                  <span>{formatTime(playerState.duration)}</span>
                </div>
                <div className='w-full bg-white/20 rounded-full h-2'>
                  <div
                    className='bg-purple-400 h-2 rounded-full transition-all duration-300'
                    style={{
                      width: playerState.duration > 0 ? `${(playerState.currentTime / playerState.duration) * 100}%` : '0%',
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
                        {formatTime(getTimerElapsedTime(timerState))}
                      </span>
                      <div className='text-xs opacity-75'>
                        {Math.floor(getTimerElapsedTime(timerState))}s total
                      </div>
                    </div>
                  </div>
                  <div className='flex justify-between'>
                    <span>Audio Position:</span>
                    <div className='text-right'>
                      <span className='font-mono'>
                        {formatTime(playerState.currentTime)}
                      </span>
                      <div className='text-xs opacity-75'>
                        {Math.floor(playerState.currentTime)}s
                      </div>
                    </div>
                  </div>
                  <div className='flex justify-between'>
                    <span>Sync Status:</span>
                    <span
                      className={`font-mono ${
                        Math.abs(playerState.currentTime - getTimerElapsedTime(timerState)) < 1
                          ? 'text-green-300'
                          : 'text-yellow-300'
                      }`}
                    >
                      {Math.abs(playerState.currentTime - getTimerElapsedTime(timerState)) < 1
                        ? 'In Sync'
                        : 'Syncing...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Volume Control */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-purple-200'>Volume</span>
                  <span className='text-sm text-purple-200 font-mono'>
                    {Math.round(playerState.volume[0] * 100)}%
                  </span>
                </div>
                <Slider
                  value={playerState.volume}
                  onValueChange={onVolumeChange}
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
  );
}; 