import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Wifi, WifiOff, Key, LogOut } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  accessCode: string;
  onChangeAccessCode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  isConnected, 
  accessCode, 
  onChangeAccessCode 
}) => {
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
    <div className='text-center space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex-1'></div>
        <div className='flex-1 text-center space-y-2'>
          <h1 className='text-4xl font-bold flex items-center justify-center gap-2'>
            <Radio className='w-8 h-8 text-purple-400' />
            Radio Music Player
          </h1>
          <p className='text-purple-200'>
            Synchronized with master timer • Real-time streaming
          </p>
        </div>
        <div className='flex-1 flex justify-end'>
          <Button
            variant='outline'
            size='sm'
            onClick={onChangeAccessCode}
            className='flex items-center gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white hover:border-white/50 transition-colors backdrop-blur-sm'
          >
            <LogOut className='w-4 h-4' />
            Change Code
          </Button>
        </div>
      </div>

      <div className='flex justify-center gap-2 flex-wrap'>
        {getConnectionStatus()}
        <Badge
          variant='outline'
          className='bg-purple-700 text-purple-200 border-purple-500'
        >
          🎵 Timer Sync
        </Badge>
        <Badge
          variant='outline'
          className='bg-blue-700 text-blue-200 border-blue-500 flex items-center gap-1'
        >
          <Key className='w-3 h-3' />
          Code: {accessCode}
        </Badge>
      </div>
    </div>
  );
}; 