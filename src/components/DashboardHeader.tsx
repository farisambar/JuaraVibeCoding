import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDeadlines } from '../contexts/DeadlineContext';
import { useCategories } from '../contexts/CategoryContext';
import { useSchedules } from '../contexts/ScheduleContext';
import { parseISO, isBefore, startOfDay } from 'date-fns';

export default function DashboardHeader() {
  const { deadlines } = useDeadlines();
  const { categories } = useCategories();
  const { schedules } = useSchedules();

  const today = startOfDay(new Date());

  const stats = useMemo(() => {
    const overdue = deadlines.filter(d => isBefore(parseISO(d.dueDate), today));
    // Upcoming schedules: date >= today
    const upcomingSchedules = schedules.filter(s => !isBefore(parseISO(s.date), today));
    return {
      active: deadlines.length,
      overdue: overdue.length,
      categories: categories.length,
      schedules: upcomingSchedules.length,
    };
  }, [deadlines, categories, schedules]);

  return (
    <header className="relative">
      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-6 pb-7">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <Link
              to="/"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-background/50 border border-border text-foreground hover:bg-muted transition-all backdrop-blur-sm shrink-0 shadow-sm"
              title="Back to Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-7 w-auto object-contain drop-shadow-sm"
                />
                <h1 className="text-2xl font-black tracking-tight text-foreground drop-shadow-sm">
                  Time
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 font-medium">
                Manage deadlines and track remaining time.
              </p>
            </div>
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex flex-wrap gap-2 mt-5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/50 border border-border backdrop-blur-sm text-foreground text-xs font-semibold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            {stats.active} Active deadline{stats.active !== 1 ? 's' : ''}
          </div>
          {stats.overdue > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-200 dark:border-red-900/50 backdrop-blur-sm text-red-600 dark:text-red-400 text-xs font-semibold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {stats.overdue} Overdue
            </div>
          ) : stats.active > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-200 dark:border-green-900/50 backdrop-blur-sm text-green-600 dark:text-green-400 text-xs font-semibold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              On track
            </div>
          ) : null}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/50 border border-border backdrop-blur-sm text-foreground text-xs font-semibold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            {stats.categories} {stats.categories === 1 ? 'Category' : 'Categories'}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/50 border border-border backdrop-blur-sm text-foreground text-xs font-semibold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
            {stats.schedules} Ongoing schedule{stats.schedules !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </header>
  );
}
