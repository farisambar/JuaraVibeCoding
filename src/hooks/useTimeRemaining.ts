import { useState, useEffect } from 'react';
import { Deadline } from '../types';
import { calculateTimeRemaining, isOverdue } from '../utils/timeCalculations';
import { formatTimeRemaining } from '../utils/formatting';

export const useTimeRemaining = (deadline: Deadline) => {
  const [timeRemaining, setTimeRemaining] = useState(() => formatTimeRemaining(calculateTimeRemaining(deadline.dueDate, deadline.dueTime)));
  const [isOverdueState, setIsOverdueState] = useState(() => isOverdue(deadline.dueDate, deadline.dueTime));
  const [totalMinutes, setTotalMinutes] = useState(() => calculateTimeRemaining(deadline.dueDate, deadline.dueTime));

  useEffect(() => {
    const update = () => {
      const mins = calculateTimeRemaining(deadline.dueDate, deadline.dueTime);
      setTotalMinutes(mins);
      setTimeRemaining(formatTimeRemaining(mins));
      setIsOverdueState(isOverdue(deadline.dueDate, deadline.dueTime));
    };

    const intervalId = setInterval(update, 60000);
    update(); // initial tick in case of tab focus or slight delay

    return () => clearInterval(intervalId);
  }, [deadline.dueDate, deadline.dueTime]);

  return { timeRemaining, isOverdue: isOverdueState, totalMinutes };
};
