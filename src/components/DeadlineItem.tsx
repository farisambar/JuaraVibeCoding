import React, { useState } from 'react';
import { Deadline, FormError, SubDeadline } from '../types';
import { useTimeRemaining } from '../hooks/useTimeRemaining';
import { formatDueDate, formatDueTime, formatTimeRemaining } from '../utils/formatting';
import { calculateTimeRemaining, isOverdue as checkIsOverdue } from '../utils/timeCalculations';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { validateTaskName, validateDueDate, validateDueTime, validateProgress, getLocalTodayString } from '../utils/validation';
import { Calendar, Clock, CheckCircle2, Edit2, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useDeadlines } from '../contexts/DeadlineContext';
import { useCategories } from '../contexts/CategoryContext';
import { Category } from '../types';

interface DeadlineItemProps {
  deadline: Deadline;
  key?: React.Key;
}

export default function DeadlineItem({ deadline }: DeadlineItemProps) {
  const { timeRemaining, isOverdue, totalMinutes } = useTimeRemaining(deadline);
  const { markAsDone, deleteDeadline, updateDeadline } = useDeadlines();
  const { getCategoryById, categories } = useCategories();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(deadline.title);
  const [editDueDate, setEditDueDate] = useState(deadline.dueDate);
  const [editDueTime, setEditDueTime] = useState(deadline.dueTime || '');
  const [editNotes, setEditNotes] = useState(deadline.notes || '');
  
  const [editTrackProgress, setEditTrackProgress] = useState(deadline.progress !== null && deadline.progress !== undefined);
  const [editProgress, setEditProgress] = useState<number | ''>(deadline.progress ?? 0);
  const [errors, setErrors] = useState<FormError>({});

  // Category edit state (simple toggle from existing categories)
  const [editSelectedCategoryIds, setEditSelectedCategoryIds] = useState<string[]>([]);

  const toggleEditCategory = (id: string) => {
    setEditSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  
  interface EditSubDeadlineInput {
    id: string;
    title: string;
    dueDate: string;
    dueTime: string;
    trackProgress: boolean;
    progressStart: number | '';
    isDone: boolean;
    completedAt: string | null;
    notes: string;
  }

  const [editSubDeadlines, setEditSubDeadlines] = useState<EditSubDeadlineInput[]>([]);
  const [subErrors, setSubErrors] = useState<Record<string, FormError>>({});
  
  const [expanded, setExpanded] = useState(false);
  
  const hasSubDeadlines = deadline.subDeadlines && deadline.subDeadlines.length > 0;
  const shouldShowControls = !deadline.isDone && !hasSubDeadlines;

  const handleEditClick = () => {
    setEditTitle(deadline.title);
    setEditDueDate(deadline.dueDate);
    setEditDueTime(deadline.dueTime || '');
    setEditNotes(deadline.notes || '');
    setEditTrackProgress(deadline.progress !== null && deadline.progress !== undefined);
    setEditProgress(deadline.progress ?? 0);
    setErrors({});
    setSubErrors({});
    setEditSubDeadlines(
      (deadline.subDeadlines || []).map(s => ({
        id: s.id,
        title: s.title,
        dueDate: s.dueDate || '',
        dueTime: s.dueTime || '',
        trackProgress: s.progress !== null && s.progress !== undefined,
        progressStart: s.progress ?? 0,
        isDone: s.isDone,
        completedAt: s.completedAt,
        notes: s.notes || ''
      }))
    );
    setEditSelectedCategoryIds(deadline.categoryIds || []);
    setIsEditing(true);
  };

  const handleAddEditSubDeadline = () => {
    setEditSubDeadlines([
      ...editSubDeadlines, 
      { id: crypto.randomUUID(), title: '', dueDate: '', dueTime: '', trackProgress: false, progressStart: 0, isDone: false, completedAt: null, notes: '' }
    ]);
  };

  const handleRemoveEditSubDeadline = (id: string) => {
    setEditSubDeadlines(editSubDeadlines.filter(s => s.id !== id));
    const newSubErrors = { ...subErrors };
    delete newSubErrors[id];
    setSubErrors(newSubErrors);
  };

  const handleUpdateEditSubDeadline = (id: string, field: keyof EditSubDeadlineInput, value: any) => {
    setEditSubDeadlines(editSubDeadlines.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSave = () => {
    let hasError = false;
    const titleErr = validateTaskName(editTitle);
    const dateErr = validateDueDate(editDueDate);
    const timeErr = validateDueTime(editDueTime || null);
    
    const nowHasSubs = editSubDeadlines.length > 0;
    // Disable assigning direct manual progress if it has sub-deadlines, as it gets calculated automatically
    const progVal = nowHasSubs ? deadline.progress : (editTrackProgress ? (typeof editProgress === 'number' ? editProgress : 0) : null);
    const progErr = (editTrackProgress && !nowHasSubs) ? validateProgress(progVal) : null;

    if (titleErr || dateErr || timeErr || progErr) {
      setErrors({ taskName: titleErr || undefined, dueDate: dateErr || undefined, dueTime: timeErr || undefined, progress: progErr || undefined });
      hasError = true;
    } else {
      setErrors({});
    }

    const newSubErrors: Record<string, FormError> = {};
    const parsedSubs: SubDeadline[] = [];

    editSubDeadlines.forEach(sub => {
      const sTitleErr = validateTaskName(sub.title);
      const sDueDate = sub.dueDate || editDueDate;
      const sDueTime = sub.dueDate ? (sub.dueTime ? sub.dueTime : null) : (editDueTime ? editDueTime : null);
      const sDateErr = sub.dueDate ? validateDueDate(sub.dueDate) : (editDueDate ? null : 'Parent due date must be set if child has no due date');
      const sTimeErr = sub.dueTime ? validateDueTime(sub.dueTime) : null;
      
      const sProgVal = sub.trackProgress ? (typeof sub.progressStart === 'number' ? sub.progressStart : 0) : null;
      const sProgErr = sub.trackProgress ? validateProgress(sProgVal) : null;

      if (sTitleErr || sDateErr || sTimeErr || sProgErr) {
        newSubErrors[sub.id] = { taskName: sTitleErr || undefined, dueDate: sDateErr || undefined, dueTime: sTimeErr || undefined, progress: sProgErr || undefined };
        hasError = true;
      }

      parsedSubs.push({
        id: sub.id,
        title: sub.title.trim(),
        dueDate: sDueDate,
        dueTime: sDueTime || null,
        progress: sProgVal,
        isDone: sub.isDone,
        completedAt: sub.completedAt,
        notes: sub.notes.trim() || undefined
      });
    });

    setSubErrors(newSubErrors);

    if (hasError) return;

    updateDeadline(deadline.id, {
      title: editTitle,
      dueDate: editDueDate,
      dueTime: editDueTime || null,
      notes: editNotes.trim() || undefined,
      progress: progVal,
      subDeadlines: parsedSubs.length > 0 ? parsedSubs : [],
      categoryIds: editSelectedCategoryIds,
    });
    setIsEditing(false);
  };

  const handleUpdateSubDeadline = (subId: string, updates: Partial<SubDeadline>) => {
    if (!deadline.subDeadlines) return;
    const newSubs = deadline.subDeadlines.map(sub => sub.id === subId ? { ...sub, ...updates } : sub);
    updateDeadline(deadline.id, { subDeadlines: newSubs });
  };

  if (isEditing) {
    const nowHasSubs = editSubDeadlines.length > 0;
    return (
      <div className="p-4 bg-card border border-blue-200 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={errors.taskName ? 'border-red-500' : ''} />
            {errors.taskName && <p className="text-xs text-red-500">{errors.taskName}</p>}
          </div>
          <div className="space-y-1">
            <div className="relative">
              <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className={cn("pr-8", errors.dueDate ? 'border-red-500' : '')} min={getLocalTodayString()} />
              {editDueDate && (
                <Button type="button" variant="ghost" size="icon" className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted" onClick={() => setEditDueDate('')}>
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            {errors.dueDate && <p className="text-xs text-red-500">{errors.dueDate}</p>}
          </div>
          <div className="space-y-1">
            <div className="relative">
              <Input type="time" value={editDueTime} onChange={(e) => setEditDueTime(e.target.value)} className={cn("pr-8", errors.dueTime ? 'border-red-500' : '')} />
              {editDueTime && (
                <Button type="button" variant="ghost" size="icon" className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted" onClick={() => setEditDueTime('')}>
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            {errors.dueTime && <p className="text-xs text-red-500">{errors.dueTime}</p>}
          </div>
        </div>
        
        <div className="space-y-1">
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Add some details... (Optional)"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px]"
          />
        </div>

        {/* Category picker in edit mode */}
        {categories.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Categories</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => {
                const selected = editSelectedCategoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleEditCategory(cat.id)}
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

        {editSubDeadlines.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-semibold text-foreground">Sub-deadlines</h4>
            {editSubDeadlines.map((sub) => (
              <div key={sub.id} className="p-3 bg-muted/30 border border-border rounded-md space-y-3 relative">
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 h-8 w-8" onClick={() => handleRemoveEditSubDeadline(sub.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pr-10">
                  <div className="space-y-1">
                    <Input 
                      value={sub.title} 
                      onChange={(e) => handleUpdateEditSubDeadline(sub.id, 'title', e.target.value)} 
                      placeholder="Sub-task name *"
                      className={`h-9 ${subErrors[sub.id]?.taskName ? 'border-red-500' : ''}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="relative">
                      <Input 
                        type="date"
                        value={sub.dueDate} 
                        onChange={(e) => handleUpdateEditSubDeadline(sub.id, 'dueDate', e.target.value)} 
                        className={cn("h-9 pr-8", subErrors[sub.id]?.dueDate ? 'border-red-500' : '')}
                        title="Leave empty to use parent's due date"
                        min={getLocalTodayString()}
                      />
                      {sub.dueDate && (
                        <Button type="button" variant="ghost" size="icon" className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted" onClick={() => handleUpdateEditSubDeadline(sub.id, 'dueDate', '')}>
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
                        onChange={(e) => handleUpdateEditSubDeadline(sub.id, 'dueTime', e.target.value)} 
                        className={cn("h-9 pr-8", subErrors[sub.id]?.dueTime ? 'border-red-500' : '')}
                        title="Leave empty to use parent's due time"
                      />
                      {sub.dueTime && (
                        <Button type="button" variant="ghost" size="icon" className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted" onClick={() => handleUpdateEditSubDeadline(sub.id, 'dueTime', '')}>
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1 pr-10">
                  <textarea 
                    value={sub.notes}
                    onChange={(e) => handleUpdateEditSubDeadline(sub.id, 'notes', e.target.value)}
                    placeholder="Sub-deadline notes (optional)"
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[50px] resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={sub.trackProgress} onChange={(e) => handleUpdateEditSubDeadline(sub.id, 'trackProgress', e.target.checked)} className="rounded border-input w-4 h-4 text-primary focus:ring-ring" />
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
                          handleUpdateEditSubDeadline(sub.id, 'progressStart', val);
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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button type="button" variant="outline" size="sm" onClick={handleAddEditSubDeadline} className="text-primary border-primary/30 hover:bg-primary/10">
              <Plus className="w-4 h-4 mr-1" /> Add Sub-deadline
            </Button>
            
            {!nowHasSubs && (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editTrackProgress} onChange={(e) => setEditTrackProgress(e.target.checked)} className="rounded border-input w-4 h-4 text-primary focus:ring-ring" />
                  <span className="text-sm font-medium text-foreground">Track Progress (%)</span>
                </label>
                
                {editTrackProgress && (
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={editProgress} 
                      onChange={(e) => {
                        let val: number | '' = e.target.value === '' ? '' : parseInt(e.target.value);
                        if (typeof val === 'number') {
                          if (isNaN(val)) val = 0;
                          if (val < 0) val = 0;
                          if (val > 100) val = 100;
                        }
                        setEditProgress(val);
                      }} 
                      className={`w-20 h-9 ${errors.progress ? 'border-red-500' : ''}`}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    {errors.progress && <p className="text-xs text-red-500">{errors.progress}</p>}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-lg border shadow-sm flex flex-col md:flex-row items-start justify-between gap-4 transition-colors",
      deadline.isDone ? "bg-muted/30 border-border opacity-60" : 
      isOverdue ? "bg-red-50 border-red-200" : "bg-card border-border"
    )}>
      <div className="flex-1 space-y-1 min-w-0 w-full">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <h4 className={cn("font-semibold text-lg truncate", deadline.isDone ? "line-through text-muted-foreground" : isOverdue ? "text-red-900" : "text-foreground")}>
              {deadline.title}
            </h4>
            {deadline.categoryIds && deadline.categoryIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {deadline.categoryIds.map(id => {
                  const cat = getCategoryById(id);
                  if (!cat) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.name}
                    </span>
                  );
                })}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground pb-1">
              <span className="flex items-center gap-1.5 bg-muted text-foreground px-2.5 py-1 rounded-md text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5" /> {formatDueDate(deadline.dueDate)}
              </span>
              {deadline.dueTime && (
                <span className="flex items-center gap-1.5 bg-muted text-foreground px-2.5 py-1 rounded-md text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5" /> {formatDueTime(deadline.dueTime)}
                </span>
              )}
              {!deadline.isDone && (
                <span className={cn(
                  "font-semibold text-xs px-2.5 py-1 rounded-md", 
                  isOverdue ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-500" :
                  totalMinutes < 1440 ? "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-500" :
                  totalMinutes < 4320 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-500" :
                  "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-500"
                )}>
                  {timeRemaining}
                </span>
              )}
            </div>
            {deadline.notes && (
              <div className={cn("text-sm mt-3 pt-3 border-t border-border/50 whitespace-pre-wrap leading-relaxed", deadline.isDone ? "text-muted-foreground" : "text-foreground font-medium")}>
                {deadline.notes}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 self-start shrink-0 ml-4">
            {!deadline.isDone && (
              <Button size="icon" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => markAsDone(deadline.id)} title="Mark as Done">
                <CheckCircle2 className="w-5 h-5" />
              </Button>
            )}
            {!deadline.isDone && (
              <Button size="icon" variant="ghost" onClick={handleEditClick} title="Edit">
                <Edit2 className="w-5 h-5" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => deleteDeadline(deadline.id)} title="Delete">
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {(deadline.progress !== undefined && deadline.progress !== null) && (
          <div className="mt-2 w-full max-w-sm pt-2">
            <div className="flex justify-between items-center text-xs mb-1">
              <div className="flex items-center gap-1">
                {shouldShowControls && (
                  <button 
                    onClick={() => updateDeadline(deadline.id, { progress: Math.max(0, (deadline.progress || 0) - 1) })}
                    className="p-1 hover:bg-muted/50 rounded text-muted-foreground transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                )}
                <span className={deadline.isDone ? "text-muted-foreground" : "text-muted-foreground font-medium"}>Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={deadline.isDone ? "text-muted-foreground" : "text-foreground font-semibold"}>{deadline.progress}%</span>
                {shouldShowControls && (
                  <button 
                    onClick={() => updateDeadline(deadline.id, { progress: Math.min(100, (deadline.progress || 0) + 1) })}
                    className="p-1 hover:bg-muted/50 rounded text-muted-foreground transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={cn("h-2 rounded-full transition-all duration-500", deadline.isDone ? "bg-accent" : isOverdue ? "bg-red-500" : "bg-primary/100")} 
                style={{ width: `${Math.min(100, Math.max(0, deadline.progress))}%` }}
              ></div>
            </div>
          </div>
        )}

        {hasSubDeadlines && (
          <div className="mt-4 pt-2">
            <button 
              onClick={() => setExpanded(!expanded)} 
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
              {deadline.subDeadlines!.length} Sub-deadlines
            </button>
            
            {expanded && (
              <div className="mt-3 pl-4 border-l-2 border-border space-y-3">
                {deadline.subDeadlines!.map((sub) => (
                  <div key={sub.id} className={cn(
                    "flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 rounded-md border",
                    sub.isDone ? "bg-muted/30 border-border opacity-70" : "bg-card border-border"
                  )}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h5 className={cn("text-sm font-semibold truncate", sub.isDone ? "line-through text-muted-foreground" : "text-foreground")}>
                          {sub.title}
                        </h5>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1 bg-muted/60 text-foreground px-2 py-0.5 rounded text-[11px] font-medium border border-border/50">
                          <Calendar className="w-3 h-3" /> {formatDueDate(sub.dueDate)}
                        </span>
                        {sub.dueTime && (
                          <span className="flex items-center gap-1 bg-muted/60 text-foreground px-2 py-0.5 rounded text-[11px] font-medium border border-border/50">
                            <Clock className="w-3 h-3" /> {formatDueTime(sub.dueTime)}
                          </span>
                        )}
                        {!sub.isDone && (() => {
                          const subMins = calculateTimeRemaining(sub.dueDate, sub.dueTime);
                          const subOverdue = subMins < 0;
                          return (
                            <span className={cn(
                              "font-semibold text-[11px] px-2 py-0.5 rounded border",
                              subOverdue ? "border-red-200 dark:border-red-900/50 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" :
                              subMins < 1440 ? "border-orange-200 dark:border-orange-900/50 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400" :
                              subMins < 4320 ? "border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-600" :
                              "border-green-200 dark:border-green-900/50 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-500"
                            )}>
                              {formatTimeRemaining(subMins)}
                            </span>
                          );
                        })()}
                      </div>

                      {sub.notes && (
                        <div className={cn("text-xs mt-1.5 mb-2.5 whitespace-pre-wrap leading-relaxed py-1", sub.isDone ? "text-muted-foreground" : "text-foreground font-medium")}>
                          {sub.notes}
                        </div>
                      )}

                      {(sub.progress !== undefined && sub.progress !== null) && (
                        <div className="w-full max-w-[250px]">
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <div className="flex items-center">
                              {!sub.isDone && !deadline.isDone && (
                                <button 
                                  onClick={() => handleUpdateSubDeadline(sub.id, { progress: Math.max(0, (sub.progress || 0) - 1) })} 
                                  className="p-0.5 hover:bg-muted/50 rounded text-muted-foreground"
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                </button>
                              )}
                              <span className="text-muted-foreground ml-1">Progress</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground font-semibold">{sub.progress}%</span>
                              {!sub.isDone && !deadline.isDone && (
                                <button 
                                  onClick={() => handleUpdateSubDeadline(sub.id, { progress: Math.min(100, (sub.progress || 0) + 1) })} 
                                  className="p-0.5 hover:bg-muted/50 rounded text-muted-foreground"
                                >
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-muted/50 rounded-full h-1.5">
                            <div 
                              className={cn("h-1.5 rounded-full transition-all duration-500", sub.isDone ? "bg-accent" : "bg-primary/60")} 
                              style={{ width: `${Math.min(100, Math.max(0, sub.progress))}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0 self-end md:self-auto">
                      {/* Removed check button for child deadlines per request */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
