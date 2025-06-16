export const formatTime = (tenthsOfSeconds: number): string => {
  if (isNaN(tenthsOfSeconds) || tenthsOfSeconds < 0) return '00:00.0';

  // Convert tenths of seconds to seconds
  const totalSeconds = tenthsOfSeconds / 10;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds * 10) % 10);

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}.${tenths}`;
};

export const getProgressPercentage = (duration: number, remainingTime: number): number => {
  if (duration === 0) return 0;
  const elapsed = duration - remainingTime;
  return Math.min(100, Math.max(0, (elapsed / duration) * 100));
};

export const validateDuration = (duration: string): { isValid: boolean; value?: number; error?: string } => {
  const parsed = parseFloat(duration);
  if (!parsed || parsed <= 0) {
    return {
      isValid: false,
      error: 'Please enter a positive number of seconds (decimals allowed)'
    };
  }
  return { isValid: true, value: parsed };
};

export const validateElapsedTime = (elapsedTime: string): { isValid: boolean; value?: number; error?: string } => {
  const parsed = parseFloat(elapsedTime);
  if (isNaN(parsed) || parsed < 0) {
    return {
      isValid: false,
      error: 'Please enter a valid non-negative number of seconds'
    };
  }
  return { isValid: true, value: parsed };
}; 