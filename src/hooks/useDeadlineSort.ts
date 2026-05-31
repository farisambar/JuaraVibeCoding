import { useMemo } from 'react';
import { Deadline } from '../types';
import { sortDeadlines } from '../utils/sorting';

export const useDeadlineSort = (deadlines: Deadline[]) => {
  return useMemo(() => {
    const active = deadlines.filter((d) => !d.isDone);
    const completed = deadlines.filter((d) => d.isDone).sort((a, b) => {
      if (!a.completedAt || !b.completedAt) return 0;
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    });

    return {
      activeDeadlines: sortDeadlines(active),
      completedDeadlines: completed,
    };
  }, [deadlines]);
};
