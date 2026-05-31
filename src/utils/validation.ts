import { Deadline } from '../types';

export const validateTaskName = (name: string): string | null => {
  const trimmed = name.trim();
  if (!trimmed) return "Task name is required";
  if (trimmed.length > 100) return "Task name must be 100 characters or less";
  return null;
};

export const getLocalTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const validateDueDate = (date: string): string | null => {
  if (!date) return "Due date is required";
  // Basic YYYY-MM-DD validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Please enter a valid date";
  
  if (date < getLocalTodayString()) {
    return "Due date cannot be before today";
  }

  return null;
};

export const validateDueTime = (time: string | null): string | null => {
  if (!time) return null;
  if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) return "Time must be in HH:MM format (e.g., 14:30)";
  return null;
};

export const validateProgress = (progress: number | null | undefined): string | null => {
  if (progress === null || progress === undefined) return null;
  if (isNaN(progress) || progress < 0 || progress > 100) return "Progress must be between 0 and 100";
  return null;
};

export const isValidDeadline = (data: any): data is Deadline => {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.title === 'string' &&
    typeof data.dueDate === 'string' &&
    (data.dueTime === null || typeof data.dueTime === 'string') &&
    typeof data.isDone === 'boolean' &&
    typeof data.createdAt === 'string' &&
    (data.completedAt === null || typeof data.completedAt === 'string') &&
    (data.progress === undefined || data.progress === null || typeof data.progress === 'number')
  );
};
