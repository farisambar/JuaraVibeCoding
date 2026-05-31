import React, { createContext, useContext, ReactNode } from 'react';
import { ScheduleEvent } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface ScheduleContextValue {
  schedules: ScheduleEvent[];
  addSchedule: (schedule: Omit<ScheduleEvent, 'id'>) => void;
  updateSchedule: (id: string, updates: Partial<Omit<ScheduleEvent, 'id'>>) => void;
  deleteSchedule: (id: string) => void;
}

const ScheduleContext = createContext<ScheduleContextValue | undefined>(undefined);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const [schedules, setSchedules] = useLocalStorage<ScheduleEvent[]>('time:schedules', []);

  const addSchedule = (item: Omit<ScheduleEvent, 'id'>) => {
    const newSchedule: ScheduleEvent = {
      ...item,
      id: crypto.randomUUID(),
    };
    setSchedules((prev) => [...prev, newSchedule]);
  };

  const deleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSchedule = (id: string, updates: Partial<Omit<ScheduleEvent, 'id'>>) => {
    setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
  };

  return (
    <ScheduleContext.Provider value={{ schedules, addSchedule, updateSchedule, deleteSchedule }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedules = () => {
  const context = useContext(ScheduleContext);
  if (!context) throw new Error('useSchedules must be used within ScheduleProvider');
  return context;
};
