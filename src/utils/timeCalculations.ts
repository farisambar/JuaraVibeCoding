export const getEffectiveDueTime = (dueDate: string, dueTime: string | null): number => {
  if (dueTime) {
    return new Date(`${dueDate}T${dueTime}:00`).getTime();
  }
  return new Date(`${dueDate}T23:59:59.999`).getTime();
};

export const calculateTimeRemaining = (dueDate: string, dueTime: string | null): number => {
  const effectiveTime = getEffectiveDueTime(dueDate, dueTime);
  const now = Date.now();
  return (effectiveTime - now) / 1000 / 60; // in minutes
};

export const isOverdue = (dueDate: string, dueTime: string | null): boolean => {
  const effectiveTime = getEffectiveDueTime(dueDate, dueTime);
  return Date.now() > effectiveTime;
};
