import React, { useState } from 'react';
import { Deadline } from '../types';
import DeadlineItem from './DeadlineItem';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function CompletedSection({ deadlines }: { deadlines: Deadline[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (deadlines.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <Button variant="ghost" className="w-full justify-between" onClick={() => setIsOpen(!isOpen)}>
        <span className="font-semibold text-foreground">Completed ({deadlines.length})</span>
        {isOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
      </Button>
      
      {isOpen && (
        <div className="space-y-4">
          {deadlines.map((d) => (
            <DeadlineItem key={d.id} deadline={d} />
          ))}
        </div>
      )}
    </div>
  );
}
