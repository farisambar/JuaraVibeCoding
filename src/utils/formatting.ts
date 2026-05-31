export const formatTimeRemaining = (minutes: number): string => {
  const isPast = minutes < 0;
  const absMinutes = Math.floor(Math.abs(minutes));

  const days = Math.floor(absMinutes / 1440);
  const hours = Math.floor((absMinutes % 1440) / 60);
  const mins = absMinutes % 60;

  let timeString = '';
  if (days > 0) {
    timeString = hours > 0 ? `${days} days ${hours} hours` : `${days} days`;
  } else if (hours > 0) {
    timeString = mins > 0 ? `${hours} hours ${mins} minutes` : `${hours} hours`;
  } else {
    timeString = `${mins} minutes`;
  }

  return isPast ? `Overdue by ${timeString}` : `${timeString} left`;
};

export const formatDueDate = (dateStr: string): string => {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDueTime = (timeStr: string | null): string => {
  if (!timeStr) return '';
  return timeStr;
};
