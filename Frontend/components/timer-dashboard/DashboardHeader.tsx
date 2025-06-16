import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Timer as TimerIcon, Zap, Square, Key, LogOut } from 'lucide-react';

interface DashboardHeaderProps {
  isConnected: boolean;
  accessCode: string;
  onChangeAccessCode: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  isConnected, 
  accessCode, 
  onChangeAccessCode 
}) => {
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
    <div className='text-center space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex-1'></div>
        <div className='flex-1 text-center space-y-2'>
          <h1 className='text-4xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-2'>
            <TimerIcon className='w-8 h-8 text-blue-600' />
            Radio Control Center
          </h1>
          <p className='text-gray-600 dark:text-gray-300'>
            Master timer controlling synchronized music players
          </p>
        </div>
        <div className='flex-1 flex justify-end'>
          <Button
            variant='outline'
            size='sm'
            onClick={onChangeAccessCode}
            className='flex items-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors'
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
          className='bg-purple-100 dark:bg-purple-900'
        >
          🎵 Music Sync Active
        </Badge>
        <Badge
          variant='outline'
          className='bg-blue-100 dark:bg-blue-900 flex items-center gap-1'
        >
          <Key className='w-3 h-3' />
          Code: {accessCode}
        </Badge>
      </div>
    </div>
  );
}; 