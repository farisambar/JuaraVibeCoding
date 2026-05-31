import React, { useState, useMemo } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import AddDeadlineForm from '../components/AddDeadlineForm';
import DeadlineList from '../components/DeadlineList';
import { useDeadlines } from '../contexts/DeadlineContext';
import { useSchedules } from '../contexts/ScheduleContext';
import { useCategories } from '../contexts/CategoryContext';
import { useDeadlineSort } from '../hooks/useDeadlineSort';
import { Button } from '../components/ui/button';
import { Plus, X, Calendar, Clock, List, CalendarDays, Filter, Tag, Search } from 'lucide-react';
import { FullScreenCalendar, CalendarData } from '../components/ui/fullscreen-calendar';
import CategoryManagement from '../components/CategoryManagement';
import { format, parseISO } from 'date-fns';

export default function Dashboard() {
  const { deadlines } = useDeadlines();
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useSchedules();
  const { categories } = useCategories();
  const { activeDeadlines } = useDeadlineSort(deadlines);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'deadlines' | 'schedule' | 'categories'>('deadlines');
  const [deadlineView, setDeadlineView] = useState<'list' | 'calendar'>('list');
  const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>([]);
  const [deadlineSearch, setDeadlineSearch] = useState('');

  // Filter active deadlines by selected categories
  const filteredActiveDeadlines = useMemo(() => {
    if (filterCategoryIds.length === 0) return activeDeadlines;
    return activeDeadlines.filter(d =>
      d.categoryIds && d.categoryIds.some(id => filterCategoryIds.includes(id))
    );
  }, [activeDeadlines, filterCategoryIds]);

  // Search within filtered deadlines
  const searchedDeadlines = useMemo(() => {
    if (!deadlineSearch.trim()) return filteredActiveDeadlines;
    const q = deadlineSearch.toLowerCase();
    return filteredActiveDeadlines.filter(d =>
      d.title.toLowerCase().includes(q)
    );
  }, [filteredActiveDeadlines, deadlineSearch]);

  // Calendar data for the Deadlines tab — each deadline shown only on its due date
  const deadlineCalendarData = useMemo<CalendarData[]>(() => {
    const rawMap: Record<string, any[]> = {};

    searchedDeadlines.forEach(deadline => {
      const color = deadline.categoryIds?.[0]
        ? categories.find(c => c.id === deadline.categoryIds![0])?.color
        : undefined;

      const dateKey = deadline.dueDate;
      if (!rawMap[dateKey]) rawMap[dateKey] = [];
      rawMap[dateKey].push({
        id: `deadline-cal-${deadline.id}`,
        name: deadline.title,
        time: deadline.dueTime || '23:59',
        datetime: `${deadline.dueDate}T${deadline.dueTime || '23:59'}`,
        isDeadline: true,
        color,
      });
    });

    return Object.keys(rawMap).map(dateKey => {
      const parts = dateKey.split('-');
      const localDay = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return { day: localDay, events: rawMap[dateKey] };
    });
  }, [searchedDeadlines, categories]);

  const toggleCategoryFilter = (id: string) => {
    setFilterCategoryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Convert both schedules and deadlines to the calendar format
  const calendarData = useMemo<CalendarData[]>(() => {
    const rawMap: Record<string, any[]> = {};

    // 1. Map scheds
    schedules.forEach((item) => {
      if (!rawMap[item.date]) {
        rawMap[item.date] = [];
      }
      rawMap[item.date].push({
        id: item.id,
        name: item.name,
        time: item.time,
        datetime: `${item.date}T${item.time}`,
        isDeadline: false,
      });
    });

    // 2. Map active deadlines
    deadlines.forEach((item) => {
      if (!item.isDone) {
        if (!rawMap[item.dueDate]) {
          rawMap[item.dueDate] = [];
        }
        rawMap[item.dueDate].push({
          id: `deadline-${item.id}`,
          name: item.title,
          time: item.dueTime || "23:59",
          datetime: `${item.dueDate}T${item.dueTime || "23:59"}`,
          isDeadline: true,
        });
      }
    });

    return Object.keys(rawMap).map((dateKey) => {
      const parts = dateKey.split('-');
      // year, monthIndex, day
      const localDay = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return {
        day: localDay,
        events: rawMap[dateKey],
      };
    });
  }, [schedules, deadlines]);

  const handleAddCalendarEvent = (dateStr: string, name: string, timeStr: string) => {
    addSchedule({ name, date: dateStr, time: timeStr });
  };

  const handleDeleteCalendarEvent = (id: string | number) => {
    if (typeof id === 'string' && !id.startsWith('deadline-')) {
      deleteSchedule(id);
    }
  };

  const handleEditCalendarEvent = (id: string | number, name: string, date: string, time: string) => {
    if (typeof id === 'string' && !id.startsWith('deadline-')) {
      updateSchedule(id, { name, date, time });
    }
  };

  return (
    <div className="min-h-screen text-foreground pb-20 relative overflow-x-hidden">
      {/* Global Background */}
      <div className="fixed inset-0 z-0">
        <img
          src="/bg_hero_juara.png"
          alt=""
          className="w-full h-full object-cover object-top pointer-events-none select-none"
          draggable={false}
        />
        {/* Soft overlay to ensure readability */}
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[20px]" />
      </div>

      <div className="relative z-10">
        <DashboardHeader />

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6 space-y-6">
        {/* Navigation Tabs — pill segmented control */}
        <div className="flex p-1 bg-muted/70 border border-border rounded-2xl gap-1">
          {([
            { key: 'categories', icon: <Tag className="w-4 h-4" />, label: 'Categories' },
            { key: 'deadlines', icon: <Clock className="w-4 h-4" />, label: 'Deadlines' },
            { key: 'schedule', icon: <Calendar className="w-4 h-4" />, label: 'Schedule' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'deadlines' ? (
          <div>
            {/* Add deadline form */}
            <div className="mb-6">
              {!showAddForm ? (
                <Button onClick={() => setShowAddForm(true)} className="w-full sm:w-auto flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add New Deadline
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-muted/10 p-3 rounded-lg border border-border/40">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">New Deadline</h2>
                    <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)} className="h-8 w-8 rounded-full">
                      <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                  </div>
                  <AddDeadlineForm onAdded={() => setShowAddForm(false)} />
                </div>
              )}
            </div>

            {/* Category filter bar */}
            {categories.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground shrink-0">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>
                <button
                  onClick={() => setFilterCategoryIds([])}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    filterCategoryIds.length === 0
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategoryFilter(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      filterCategoryIds.includes(cat.id)
                        ? 'text-white border-transparent'
                        : 'bg-transparent border-border hover:border-transparent hover:text-white'
                    }`}
                    style={
                      filterCategoryIds.includes(cat.id)
                        ? { backgroundColor: cat.color, borderColor: cat.color, color: '#ffffff' }
                        : { '--hover-bg': cat.color } as React.CSSProperties
                    }
                    onMouseEnter={e => {
                      if (!filterCategoryIds.includes(cat.id)) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = cat.color + '25';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = cat.color;
                        (e.currentTarget as HTMLButtonElement).style.color = cat.color;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!filterCategoryIds.includes(cat.id)) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '';
                        (e.currentTarget as HTMLButtonElement).style.color = '';
                      }
                    }}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: filterCategoryIds.includes(cat.id) ? 'white' : cat.color }} />
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Search bar for deadlines */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search deadlines..."
                  value={deadlineSearch}
                  onChange={e => setDeadlineSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                {deadlineSearch && (
                  <button
                    onClick={() => setDeadlineSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* List / Calendar view toggle */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {deadlineView === 'list' ? 'List Deadlines' : 'Deadline Calendar'}
                {(filterCategoryIds.length > 0 || deadlineSearch.trim()) && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({searchedDeadlines.length} result{searchedDeadlines.length !== 1 ? 's' : ''})
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border">
                <button
                  onClick={() => setDeadlineView('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    deadlineView === 'list'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <List className="w-3.5 h-3.5" /> List
                </button>
                <button
                  onClick={() => setDeadlineView('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    deadlineView === 'calendar'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" /> Calendar
                </button>
              </div>
            </div>

            {deadlineView === 'list' ? (
              <DeadlineList deadlines={searchedDeadlines} />
            ) : (
              <FullScreenCalendar
                data={deadlineCalendarData}
                fullPage
              />
            )}
          </div>
        ) : activeTab === 'schedule' ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Interactive Schedule</h2>
            <FullScreenCalendar
              data={calendarData}
              onAddEvent={handleAddCalendarEvent}
              onEditEvent={handleEditCalendarEvent}
              onDeleteEvent={handleDeleteCalendarEvent}
            />
          </div>
        ) : activeTab === 'categories' ? (
          <div className="animate-in fade-in duration-200">
            <CategoryManagement />
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}
