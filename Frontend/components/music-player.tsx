'use client';

import React, { useState, useRef } from 'react';
import type { Track } from '@/types/music-player';
import { createTrackFromFile } from '@/utils/music-player';
import { AccessCodeInput } from '@/components/AccessCodeInput';
import { useTimerSync } from '@/hooks/useTimerSync';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Header } from '@/components/music-player/Header';
import { PlayerCard } from '@/components/music-player/PlayerCard';
import { TrackList } from '@/components/music-player/TrackList';
import { StatusCards } from '@/components/music-player/StatusCards';

export default function MusicPlayer() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use custom hooks for timer sync and audio player logic (only if access code is set)
  const { timerState, isConnected, lastSyncTime } = useTimerSync(accessCode);
  const {
    playerState,
    audioRef,
    currentTrack,
    selectTrack,
    handleVolumeChange,
    getPlaybackStatus,
  } = useAudioPlayer({ tracks, timerState, isConnected });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check for audio files and audio-friendly video formats
    const isAudioFile = file.type.startsWith('audio/') || 
                       file.type.startsWith('video/') ||
                       file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac|wma|opus|webm|3gp|3g2|amr|awb|mp4|mov|avi|mkv|ogv|m4v)$/i);
    
    if (isAudioFile) {
      const newTrack = createTrackFromFile(file);
      setTracks([newTrack]);
    } else {
      // Show error message for unsupported files
      console.error('Unsupported file format. Please select an audio file.');
      // You might want to show a toast notification here
    }
  };

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
        title="Music Player Access"
        description="Enter the same access code as your timer to sync music playback"
      />
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header */}
        <Header 
          isConnected={isConnected} 
          accessCode={accessCode}
          onChangeAccessCode={handleChangeAccessCode}
        />

        {/* Main Player */}
        <PlayerCard
          currentTrack={currentTrack}
          playerState={playerState}
          timerState={timerState}
          audioRef={audioRef}
          onFileSelect={handleFileSelect}
          onVolumeChange={handleVolumeChange}
          getPlaybackStatus={getPlaybackStatus}
          fileInputRef={fileInputRef}
        />

        {/* Track List */}
        <TrackList
          tracks={tracks}
          currentTrackIndex={playerState.currentTrackIndex}
          isPlaying={playerState.isPlaying}
          onSelectTrack={selectTrack}
        />

        {/* Status Cards */}
        <StatusCards
          isConnected={isConnected}
          lastSyncTime={lastSyncTime}
          timerState={timerState}
          accessCode={accessCode}
        />
      </div>
    </div>
  );
}
