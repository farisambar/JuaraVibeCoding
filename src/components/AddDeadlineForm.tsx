import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useDeadlines } from '../contexts/DeadlineContext';
import { useCategories } from '../contexts/CategoryContext';
import { validateTaskName, validateDueDate, validateDueTime, validateProgress, getLocalTodayString } from '../utils/validation';
import { FormError, SubDeadline, Category } from '../types';
import { Plus, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface SubDeadlineInput {
  id: string;
  title: string;
  dueDate: string;
  dueTime: string;
  notes: string;
  trackProgress: boolean;
  progressStart: number | '';
}

export default function AddDeadlineForm({ onAdded }: { onAdded?: () => void }) {
  const { addDeadline } = useDeadlines();
  const { categories } = useCategories();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [notes, setNotes] = useState('');
  const [trackProgress, setTrackProgress] = useState(false);
  const [progressStart, setProgressStart] = useState<number | ''>(0);
  const [errors, setErrors] = useState<FormError>({});

  // Category selection state (select from existing categories only)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const [subDeadlines, setSubDeadlines] = useState<SubDeadlineInput[]>([]);
  const [subErrors, setSubErrors] = useState<Record<string, FormError>>({});

  const addSubDeadline = () => {
    setSubDeadlines([
      ...subDeadlines, 
      { id: crypto.randomUUID(), title: '', dueDate: '', dueTime: '', trackProgress: false, progressStart: 0, notes: '' }
    ]);
  };

  const removeSubDeadline = (id: string) => {
    setSubDeadlines(subDeadlines.filter(s => s.id !== id));
    const newErrors = { ...subErrors };
    delete newErrors[id];
    setSubErrors(newErrors);
  };

  const updateSubDeadline = (id: string, field: keyof SubDeadlineInput, value: any) => {
    setSubDeadlines(subDeadlines.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasError = false;
    const titleErr = validateTaskName(title);
    const dateErr = validateDueDate(dueDate);
    const timeErr = validateDueTime(dueTime || null);
    
    const parentTrackProgress = subDeadlines.length > 0 ? false : trackProgress;
    const progVal = parentTrackProgress ? (typeof progressStart === 'number' ? progressStart : 0) : null;
    const progErr = parentTrackProgress ? validateProgress(progVal) : null;

    if (titleErr || dateErr || timeErr || progErr) {
      setErrors({ taskName: titleErr || undefined, dueDate: dateErr || undefined, dueTime: timeErr || undefined, progress: progErr || undefined });
      hasError = true;
    } else {
      setErrors({});
    }

    const newSubErrors: Record<string, FormError> = {};
    const parsedSubs: Omit<SubDeadline, 'isDone' | 'completedAt'>[] = [];

    subDeadlines.forEach(sub => {
      const sTitleErr = validateTaskName(sub.title);
      // Fallback to parent due date/time if empty
      const sDueDate = sub.dueDate || dueDate;
      const sDueTime = sub.dueTime || dueTime;
      const sDateErr = sub.dueDate ? validateDueDate(sub.dueDate) : (dueDate ? null : 'Parent due date must be set if child has no due date');
      const sTimeErr = sub.dueTime ? validateDueTime(sub.dueTime) : null;
      
      const sProgVal = sub.trackProgress ? (typeof sub.progressStart === 'number' ? sub.progressStart : 0) : null;
      const sProgErr = sub.trackProgress ? validateProgress(sProgVal) : null;

      if (sTitleErr || sDateErr || sTimeErr || sProgErr) {
        newSubErrors[sub.id] = { taskName: sTitleErr || undefined, dueDate: sDateErr || undefined, dueTime: sTimeErr || undefined, progress: sProgErr || undefined };
        hasError = true;
      }

      parsedSubs.push({
        id: crypto.randomUUID(),
        title: sub.title.trim(),
        dueDate: sDueDate,
        dueTime: sDueTime || null,
        progress: sProgVal,
        notes: sub.notes.trim() || undefined
      });
    });

    setSubErrors(newSubErrors);

    if (hasError) return;

    addDeadline({
      title,
      dueDate,
      dueTime: dueTime || null,
      progress: progVal,
      notes: notes.trim() || undefined,
      subDeadlines: parsedSubs.length > 0 ? parsedSubs.map(s => ({ ...s, isDone: false, completedAt: null })) : undefined,
      categoryIds: selectedCategoryIds,
    });

    setTitle('');
    setDueDate('');
    setDueTime('');
    setNotes('');
    setTrackProgress(false);
    setProgressStart(0);
    setErrors({});
    setSubDeadlines([]);
    setSubErrors({});
    setSelectedCategoryIds([]);
    if (onAdded) {
      onAdded();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-card rounded-lg border shadow-sm my-6 space-y-4">
      <h3 className="font-semibold text-lg text-foreground">Add New Deadline</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Task Name *</label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Submit final project"
            className={errors.taskName ? 'border-red-500' : ''}
          />
          {errors.taskName && <p className="text-xs text-red-500">{errors.taskName}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Due Date *</label>
          <div className="relative">
            <Input 
              type="date"
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)} 
              className={cn("pr-8", errors.dueDate ? 'border-red-500' : '')}
              min={getLocalTodayString()}
            />
            {dueDate && (
              <Button type="button" variant="ghost" size="icon" className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted" onClick={() => setDueDate('')}>
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          {errors.dueDate && <p className="text-xs text-red-500">{errors.dueDate}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Due Time (Optional)</label>
          <div className="relative">
            <Input 
              type="time" 
              value={dueTime} 
              onChange={(e) => setDueTime(e.target.value)} 
              className={cn("pr-8", errors.dueTime ? 'border-red-500' : '')}
            />
            {dueTime && (
              <Button type="button" variant="ghost" size="icon" className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted" onClick={() => setDueTime('')}>
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          {errors.dueTime && <p className="text-xs text-red-500">{errors.dueTime}</p>}
        </div>
      </div>
      
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add some details..."
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[60px]"
        />
      </div>

      {/* Category Selector */}
      {categories.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Categories (Optional)</label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => {
              const selected = selectedCategoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
                  style={selected
                    ? { backgroundColor: cat.color, borderColor: cat.color, color: 'white' }
                    : { backgroundColor: 'transparent', borderColor: cat.color, color: cat.color }
                  }
                >
                  {cat.name}
                  {selected && <X className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {subDeadlines.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-semibold text-foreground">Sub-deadlines</h4>
          {subDeadlines.map((sub, index) => (
            <div key={sub.id} className="p-3 bg-muted/30 border border-border rounded-md space-y-3 relative">
              <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 h-8 w-8" onClick={() => removeSubDeadline(sub.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pr-10">
                <div className="space-y-1">
                  <Input 
                    value={sub.title} 
                    onChange={(e) => updateSubDeadline(sub.id, 'title', e.target.value)} 
                    placeholder="Sub-task name *"
                    className={`h-9 ${subErrors[sub.id]?.taskName ? 'border-red-500' : ''}`}
                  />
                </div>
                <div className="space-y-1">
                  <div className="relative">
                    <Input 
                      type="date"
                      value={sub.dueDate} 
                      onChange={(e) => updateSubDeadline(sub.id, 'dueDate', e.target.value)} 
                      className={cn("h-9 pr-8", subErrors[sub.id]?.dueDate ? 'border-red-500' : '')}
                      title="Leave empty to use parent's due date"
                      min={getLocalTodayString()}
                    />
                    {sub.dueDate && (
                      <Button type="button" variant="ghost" size="icon" className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted" onClick={() => updateSubDeadline(sub.id, 'dueDate', '')}>
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="relative">
                    <Input 
                      type="time" 
                      value={sub.dueTime} 
                      onChange={(e) => updateSubDeadline(sub.id, 'dueTime', e.target.value)} 
                      className={cn("h-9 pr-8", subErrors[sub.id]?.dueTime ? 'border-red-500' : '')}
                      title="Leave empty to use parent's due time"
                    />
                    {sub.dueTime && (
                      <Button type="button" variant="ghost" size="icon" className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted" onClick={() => updateSubDeadline(sub.id, 'dueTime', '')}>
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1 pr-10">
                <textarea 
                  value={sub.notes}
                  onChange={(e) => updateSubDeadline(sub.id, 'notes', e.target.value)}
                  placeholder="Sub-deadline notes (optional)"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[50px] resize-none"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={sub.trackProgress} onChange={(e) => updateSubDeadline(sub.id, 'trackProgress', e.target.checked)} className="rounded border-input w-4 h-4 text-primary focus:ring-ring" />
                  <span className="text-xs font-medium text-foreground">Track Progress (%)</span>
                </label>
                
                {sub.trackProgress && (
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={sub.progressStart} 
                      onChange={(e) => {
                        let val: number | '' = e.target.value === '' ? '' : parseInt(e.target.value);
                        if (typeof val === 'number') {
                          if (isNaN(val)) val = 0;
                          if (val < 0) val = 0;
                          if (val > 100) val = 100;
                        }
                        updateSubDeadline(sub.id, 'progressStart', val);
                      }} 
                      className={`w-20 h-8 text-xs ${subErrors[sub.id]?.progress ? 'border-red-500' : ''}`}
                      placeholder="0"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button type="button" variant="outline" size="sm" onClick={addSubDeadline} className="text-primary border-primary/30 hover:bg-primary/10">
            <Plus className="w-4 h-4 mr-1" /> Add Sub-deadline
          </Button>
          
          {subDeadlines.length === 0 && (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={trackProgress} onChange={(e) => setTrackProgress(e.target.checked)} className="rounded border-input w-4 h-4 text-primary focus:ring-ring" />
                <span className="text-sm font-medium text-foreground">Track Progress (%)</span>
              </label>
              
              {trackProgress && (
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={progressStart} 
                    onChange={(e) => {
                      let val: number | '' = e.target.value === '' ? '' : parseInt(e.target.value);
                      if (typeof val === 'number') {
                        if (isNaN(val)) val = 0;
                        if (val < 0) val = 0;
                        if (val > 100) val = 100;
                      }
                      setProgressStart(val);
                    }} 
                    className={`w-20 ${errors.progress ? 'border-red-500' : ''}`}
                    placeholder="0"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
            </>
          )}
        </div>
        <Button type="submit">Add Deadline</Button>
      </div>
    </form>
  );
}
