'use client';

import React, { useState, useRef } from 'react';
import type { Track } from '@/types/music-player';
import { createTrackFromFile } from '@/utils/music-player';
import { useTimerSync } from '@/hooks/useTimerSync';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Header } from '@/components/music-player/Header';
import { PlayerCard } from '@/components/music-player/PlayerCard';
import { TrackList } from '@/components/music-player/TrackList';
import { StatusCards } from '@/components/music-player/StatusCards';

export default function MusicPlayer() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use custom hooks for timer sync and audio player logic
  const { timerState, isConnected, lastSyncTime } = useTimerSync();
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
    if (file.type.startsWith('audio/')) {
      const newTrack = createTrackFromFile(file);
      setTracks([newTrack]);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header */}
        <Header isConnected={isConnected} />

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
        />
      </div>
    </div>
  );
}
