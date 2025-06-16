import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Radio, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isConnected }) => {
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

  return (
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
  );
}; 