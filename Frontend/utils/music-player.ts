export const formatTime = (time: number) => {
  if (isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatTimeWithSeconds = (time: number) => {
  if (isNaN(time)) return { formatted: '0:00', totalSeconds: '0s' };
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const totalSeconds = `${Math.floor(time)}s`;
  return { formatted, totalSeconds };
};

export const getTimerElapsedTime = (timerState: { duration: number; remainingTime: number }) => {
  return (timerState.duration - timerState.remainingTime) / 10;
};

export const createTrackFromFile = (file: File) => {
  const url = URL.createObjectURL(file);
  return {
    file,
    url,
    name: file.name.replace(/\.[^/.]+$/, ''),
    duration: 0,
  };
}; 