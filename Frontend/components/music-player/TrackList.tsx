import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Radio } from 'lucide-react';
import type { Track } from '@/types/music-player';

interface TrackListProps {
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  onSelectTrack: (index: number) => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrackIndex,
  isPlaying,
  onSelectTrack,
}) => {
  if (tracks.length === 0) {
    return null;
  }

  return (
    <Card className='bg-white/10 backdrop-blur border-white/20'>
      <CardContent className='p-6'>
        <h3 className='text-lg font-semibold text-white mb-4'>
          Current Track
        </h3>
        <div className='space-y-2'>
          {tracks.map((track, index) => (
            <div
              key={index}
              onClick={() => onSelectTrack(index)}
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
  );
}; 