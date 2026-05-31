import { Deadline } from '../types';
import { getEffectiveDueTime, isOverdue } from './timeCalculations';

export const sortDeadlines = (deadlines: Deadline[]): Deadline[] => {
  const overdue: Deadline[] = [];
  const upcoming: Deadline[] = [];

  deadlines.forEach(d => {
    if (isOverdue(d.dueDate, d.dueTime)) {
      overdue.push(d);
    } else {
      upcoming.push(d);
    }
  });

  overdue.sort((a, b) => {
    // Most recently overdue first => highest effective time (closest to now) goes first
    return getEffectiveDueTime(b.dueDate, b.dueTime) - getEffectiveDueTime(a.dueDate, a.dueTime);
  });

  upcoming.sort((a, b) => {
    // Nearest deadline first => smallest effective time first
    return getEffectiveDueTime(a.dueDate, a.dueTime) - getEffectiveDueTime(b.dueDate, b.dueTime);
  });

  return [...overdue, ...upcoming];
};
