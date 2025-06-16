export interface Track {
  file: File;
  url: string;
  name: string;
  duration: number;
}

export interface TimerState {
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

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number[];
  isLoading: boolean;
  currentTrackIndex: number;
} 