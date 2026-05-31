import React from 'react';
import { Deadline } from '../types';
import DeadlineItem from './DeadlineItem';

interface DeadlineListProps {
  deadlines: Deadline[];
}

export default function DeadlineList({ deadlines }: DeadlineListProps) {
  if (deadlines.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
        <h3 className="text-lg font-medium text-foreground">No deadlines yet</h3>
        <p className="text-muted-foreground mt-1">Add your first deadline above to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deadlines.map((d) => (
        <DeadlineItem key={d.id} deadline={d} />
      ))}
    </div>
  );
}
