import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { Deadline } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface DeadlineContextValue {
  deadlines: Deadline[];
  addDeadline: (deadline: Omit<Deadline, 'id' | 'createdAt' | 'isDone' | 'completedAt'>) => void;
  updateDeadline: (id: string, updates: Partial<Deadline>) => void;
  deleteDeadline: (id: string) => void;
  markAsDone: (id: string) => void;
  getDeadlineById: (id: string) => Deadline | undefined;
}

const DeadlineContext = createContext<DeadlineContextValue | undefined>(undefined);

const recalculateParent = (d: Deadline): Deadline => {
  if (!d.subDeadlines || d.subDeadlines.length === 0) {
    if ((d.progress !== undefined && d.progress !== null) && d.progress >= 100) {
      if (!d.isDone) {
        return { ...d, progress: 100, isDone: true, completedAt: new Date().toISOString() };
      }
    } else if ((d.progress !== undefined && d.progress !== null) && d.progress < 100 && d.isDone) {
      return { ...d, isDone: false, completedAt: null };
    }
    return d;
  }

  let totalProgress = 0;
  let allDone = true;

  const resolvedSubs = d.subDeadlines.map(sub => {
     let isDone = sub.isDone;
     let completedAt = sub.completedAt;
     if (sub.progress !== undefined && sub.progress !== null) {
       if (sub.progress >= 100 && !isDone) {
         isDone = true;
         completedAt = new Date().toISOString();
       } else if (sub.progress < 100 && isDone) {
         isDone = false;
         completedAt = null;
       }
     }
     return { ...sub, isDone, completedAt };
  });

  resolvedSubs.forEach(sub => {
    if (sub.progress !== undefined && sub.progress !== null) {
      totalProgress += sub.progress;
    } else {
      totalProgress += sub.isDone ? 100 : 0;
    }
    if (!sub.isDone) allDone = false;
  });

  const avgProgress = Math.round(totalProgress / resolvedSubs.length);

  let newIsDone = allDone;
  let newCompletedAt = d.completedAt;
  
  if (newIsDone && !d.isDone) {
    newCompletedAt = new Date().toISOString();
  } else if (!newIsDone && d.isDone) {
    newCompletedAt = null;
  }

  return {
    ...d,
    subDeadlines: resolvedSubs,
    progress: avgProgress,
    isDone: newIsDone,
    completedAt: newCompletedAt
  };
};

export const DeadlineProvider = ({ children }: { children: ReactNode }) => {
  const [deadlines, setDeadlines] = useLocalStorage<Deadline[]>('deadline-coach:deadlines', []);

  // Remove any completed deadlines that may have been saved before this change
  useEffect(() => {
    setDeadlines((prev) => prev.filter((d) => !d.isDone));
  }, []);

  const addDeadline = (deadline: Omit<Deadline, 'id' | 'createdAt' | 'isDone' | 'completedAt'>) => {
    const newDeadline: Deadline = {
      ...deadline,
      id: crypto.randomUUID(),
      isDone: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      title: deadline.title.trim(),
    };
    setDeadlines((prev) => [...prev, recalculateParent(newDeadline)]);
  };

  const updateDeadline = (id: string, updates: Partial<Deadline>) => {
    setDeadlines((prev) =>
      prev
        .map((d) => {
          if (d.id === id) {
            const updated = { ...d, ...updates };
            if (updates.title) updated.title = updates.title.trim();
            return recalculateParent(updated);
          }
          return d;
        })
        .filter((d) => !d.isDone) // auto-completed via sub-deadlines gets removed immediately
    );
  };

  const deleteDeadline = (id: string) => {
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
  };

  const markAsDone = (id: string) => {
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
  };

  const getDeadlineById = (id: string) => deadlines.find((d) => d.id === id);

  return (
    <DeadlineContext.Provider
      value={{ deadlines, addDeadline, updateDeadline, deleteDeadline, markAsDone, getDeadlineById }}
    >
      {children}
    </DeadlineContext.Provider>
  );
};

export const useDeadlines = () => {
  const context = useContext(DeadlineContext);
  if (!context) throw new Error('useDeadlines must be used within DeadlineProvider');
  return context;
};
