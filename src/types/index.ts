export interface Category {
  id: string;
  name: string;
  color: string; // hex color e.g. '#3b82f6'
}

export interface SubDeadline {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string | null; // HH:MM or null
  isDone: boolean;
  completedAt: string | null;
  progress?: number | null; // 0-100 or null
  notes?: string;
}

export interface Deadline {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string | null; // HH:MM or null
  isDone: boolean;
  createdAt: string; // ISO
  completedAt: string | null; // ISO
  progress?: number | null; // 0-100 or null if not tracked
  subDeadlines?: SubDeadline[];
  notes?: string;
  categoryIds?: string[];
}

export interface PomodoroSettings {
  focusMinutes: number;
  breakMinutes: number;
  cycles: number;
  soundEnabled: boolean;
}

export interface FirstVisitFlag {
  completed: boolean;
  timestamp: string;
}

export interface FormError {
  taskName?: string;
  dueDate?: string;
  dueTime?: string;
  progress?: string;
}

export interface ScheduleEvent {
  id: string;
  name: string;
  time: string; // e.g. "10:00 AM" or "14:30"
  date: string; // YYYY-MM-DD
  isDeadline?: boolean;
}

