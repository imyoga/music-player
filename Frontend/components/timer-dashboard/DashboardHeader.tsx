import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Timer as TimerIcon, Zap, Square } from 'lucide-react';

interface DashboardHeaderProps {
  isConnected: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ isConnected }) => {
  const getConnectionStatus = () => {
    if (isConnected) {
      return (
        <Badge variant='default' className='bg-green-500'>
          <Zap className='w-3 h-3 mr-1' />
          SSE Stream
        </Badge>
      );
    } else {
      return (
        <Badge variant='destructive'>
          <Square className='w-3 h-3 mr-1' />
          Disconnected
        </Badge>
      );
    }
  };

  return (
    <div className='text-center space-y-2'>
      <h1 className='text-4xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-2'>
        <TimerIcon className='w-8 h-8 text-blue-600' />
        Radio Control Center
      </h1>
      <p className='text-gray-600 dark:text-gray-300'>
        Master timer controlling synchronized music players
      </p>
      <div className='flex justify-center gap-2'>
        {getConnectionStatus()}
        <Badge
          variant='outline'
          className='bg-purple-100 dark:bg-purple-900'
        >
          🎵 Music Sync Active
        </Badge>
      </div>
    </div>
  );
}; 