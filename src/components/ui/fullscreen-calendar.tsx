"use client"

import * as React from "react"
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  SearchIcon,
  Trash2,
  CalendarDays,
  X,
  AlertCircle,
  Edit2
} from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Separator } from "./separator"
import { useMediaQuery } from "../../hooks/use-media-query"

export interface Event {
  id: string | number
  name: string
  time: string
  datetime: string
  isDeadline?: boolean
  color?: string // hex color for category-colored events
}

export interface CalendarData {
  day: Date
  events: Event[]
}

interface FullScreenCalendarProps {
  data: CalendarData[]
  onAddEvent?: (dateStr: string, name: string, timeStr: string) => void
  onEditEvent?: (id: string | number, name: string, date: string, time: string) => void
  onDeleteEvent?: (id: string | number) => void
  fullPage?: boolean // when true: natural height, page scrolls instead of internal scroll
}

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
]

// Auto-color palette for schedule events (distinct, visually pleasing)
const EVENT_AUTO_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#22c55e', // green
  '#f97316', // orange
  '#ec4899', // pink
  '#eab308', // yellow
  '#14b8a6', // teal
  '#f43f5e', // rose
  '#6366f1', // indigo
]

export function FullScreenCalendar({ data, onAddEvent, onEditEvent, onDeleteEvent, fullPage = false }: FullScreenCalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy"),
  )
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showSearch, setShowSearch] = React.useState(false)

  // Event creation form state
  const [isAddingEvent, setIsAddingEvent] = React.useState(false)
  const [newEventName, setNewEventName] = React.useState("")
  const [newEventTime, setNewEventTime] = React.useState("10:00")
  const [newEventDate, setNewEventDate] = React.useState(format(today, "yyyy-MM-dd"))

  // Event editing state
  const [isEditingEvent, setIsEditingEvent] = React.useState(false)
  const [editEventId, setEditEventId] = React.useState<string | number | null>(null)
  const [editEventName, setEditEventName] = React.useState("")
  const [editEventTime, setEditEventTime] = React.useState("")
  const [editEventDate, setEditEventDate] = React.useState("")

  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date())
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  })

  // Synchronize newEventDate when selectedDay changes
  React.useEffect(() => {
    setNewEventDate(format(selectedDay, "yyyy-MM-dd"))
  }, [selectedDay])

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"))
    setSelectedDay(today)
  }

  const handleOpenAddEvent = () => {
    setNewEventDate(format(selectedDay, "yyyy-MM-dd"))
    setIsAddingEvent(true)
  }

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventName.trim() || !newEventTime) return

    // Prevent adding events in the past
    const now = new Date();
    const eventDateTime = new Date(`${newEventDate}T${newEventTime}`);
    if (eventDateTime < now) {
      alert("Tidak dapat menambahkan jadwal di waktu yang sudah berlalu.");
      return;
    }

    onAddEvent?.(newEventDate, newEventName.trim(), newEventTime)
    setNewEventName("")
    setIsAddingEvent(false)
  }

  const handleOpenEditEvent = (event: Event) => {
    setEditEventId(event.id)
    setEditEventName(event.name)
    setEditEventTime(event.time)
    setEditEventDate(format(selectedDay, "yyyy-MM-dd"))
    setIsEditingEvent(true)
  }

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editEventName.trim() || !editEventTime || !editEventId) return
    onEditEvent?.(editEventId, editEventName.trim(), editEventDate, editEventTime)
    setIsEditingEvent(false)
    setEditEventId(null)
  }

  // Get active selected day events — sorted by time, with auto-colors
  const selectedDayEvents = React.useMemo(() => {
    const foundData = data.find((d) => isSameDay(d.day, selectedDay))
    let list = foundData ? [...foundData.events] : []
    if (searchQuery.trim()) {
      list = list.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    // Sort by time (earliest first)
    list.sort((a, b) => a.time.localeCompare(b.time))
    // Auto-assign colors to events without a color
    let colorIdx = 0
    return list.map((event) => {
      if (!event.color && !event.isDeadline) {
        const autoColor = EVENT_AUTO_COLORS[colorIdx % EVENT_AUTO_COLORS.length]
        colorIdx++
        return { ...event, color: autoColor }
      }
      return event
    })
  }, [data, selectedDay, searchQuery])

  return (
    <div className={cn(
      "bg-card border border-border rounded-xl shadow-lg flex flex-col",
    )}>
      {/* Calendar Header */}
      <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none border-b border-border bg-muted/20">
        <div className="flex flex-auto">
          <div className="flex items-center gap-4">
            <div className="hidden w-20 flex-col items-center justify-center rounded-lg border bg-muted p-1 md:flex">
              <h1 className="text-xs uppercase font-semibold text-muted-foreground">
                {format(today, "MMM")}
              </h1>
              <div className="flex w-full items-center justify-center rounded-md border bg-background p-0.5 text-lg font-bold">
                <span>{format(today, "d")}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                {format(firstDayCurrentMonth, "MMMM, yyyy")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {format(firstDayCurrentMonth, "MMM d, yyyy")} -{" "}
                {format(endOfMonth(firstDayCurrentMonth), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
          {!fullPage && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              {showSearch ? (
                <div className="relative flex items-center w-full md:w-48 animate-in fade-in slide-in-from-right-2 duration-100">
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs rounded-md border border-input bg-background pl-8 pr-7 py-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  />
                  <SearchIcon size={12} className="absolute left-2.5 text-muted-foreground" />
                  <X
                    size={12}
                    className="absolute right-2.5 text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => { setSearchQuery(""); setShowSearch(false); }}
                  />
                </div>
              ) : (
                <Button variant="outline" size="icon" onClick={() => setShowSearch(true)} className="hidden md:flex h-8 w-8">
                  <SearchIcon size={14} strokeWidth={2} aria-hidden="true" />
                </Button>
              )}
            </div>
          )}

          {!fullPage && <Separator orientation="vertical" className="hidden h-6 md:block" />}

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              onClick={goToToday}
              className="w-full shadow-sm focus-visible:z-10 md:w-auto h-8 px-3 text-xs font-semibold"
              variant="outline"
            >
              Today
            </Button>

            <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm md:w-auto rtl:space-x-reverse">
              <Button
                onClick={previousMonth}
                className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 h-8"
                variant="outline"
                size="icon"
                aria-label="Navigate to previous month"
              >
                <ChevronLeftIcon size={14} strokeWidth={2} aria-hidden="true" />
              </Button>
              <Button
                onClick={nextMonth}
                className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 h-8"
                variant="outline"
                size="icon"
                aria-label="Navigate to next month"
              >
                <ChevronRightIcon size={14} strokeWidth={2} aria-hidden="true" />
              </Button>
            </div>
          </div>

          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <Separator
            orientation="horizontal"
            className="block w-full md:hidden"
          />

          {onAddEvent && (
            <Button onClick={handleOpenAddEvent} className="w-full gap-1.5 md:w-auto h-8 px-3 text-xs">
              <PlusCircleIcon size={14} strokeWidth={2} aria-hidden="true" />
              <span>New Event</span>
            </Button>
          )}
        </div>
      </div>

      <div className={cn(
        fullPage ? "" : "flex flex-col"
      )}>
        {/* Calendar Grid */}
        <div>
          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b border-border text-center text-xs font-semibold leading-8 lg:flex-none bg-muted/10">
            <div className="border-r border-border py-1 text-red-500/80">Sun</div>
            <div className="border-r border-border py-1">Mon</div>
            <div className="border-r border-border py-1">Tue</div>
            <div className="border-r border-border py-1">Wed</div>
            <div className="border-r border-border py-1">Thu</div>
            <div className="border-r border-border py-1">Fri</div>
            <div className="py-1">Sat</div>
          </div>

          {/* Calendar Days */}
          <div className="flex text-xs leading-6 lg:flex-auto">
            {/* Desktop grid */}
            <div className="hidden w-full lg:grid lg:grid-cols-7 lg:grid-rows-6">
              {days.map((day, dayIdx) => {
                const dayEventsData = data.find((date) => isSameDay(date.day, day))
                const dayEvents = dayEventsData ? [...dayEventsData.events].sort((a, b) => a.time.localeCompare(b.time)) : []
                // Auto-assign colors to schedule events
                let colorIdx = 0
                const coloredDayEvents = dayEvents.map((event) => {
                  if (!event.color && !event.isDeadline) {
                    const autoColor = EVENT_AUTO_COLORS[colorIdx % EVENT_AUTO_COLORS.length]
                    colorIdx++
                    return { ...event, color: autoColor }
                  }
                  return event
                })
                const isDaySelected = isEqual(day, selectedDay)
                const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth)
                return (
                  <div
                    key={dayIdx}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      dayIdx === 0 && colStartClasses[getDay(day)],
                      !isCurrentMonth && "bg-muted/40 text-muted-foreground/50",
                      isCurrentMonth && "bg-background",
                      "relative flex flex-col min-h-[90px] border-b border-r border-border hover:bg-muted/40 focus:z-10 cursor-pointer overflow-hidden transition-colors",
                      isDaySelected && "bg-primary/5 hover:bg-primary/10 border-primary/20",
                    )}
                  >
                    <header className="flex items-center justify-between p-2">
                      <button
                        type="button"
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                          isToday(day) && !isDaySelected && "bg-red-500/10 text-red-500",
                          isDaySelected && isToday(day) && "bg-primary text-primary-foreground",
                          isDaySelected && !isToday(day) && "bg-foreground text-background",
                        )}
                      >
                        <time dateTime={format(day, "yyyy-MM-dd")}>
                          {format(day, "d")}
                        </time>
                      </button>
                    </header>
                    <div className="flex-1 px-1.5 pb-1.5 space-y-1 overflow-hidden">
                      {coloredDayEvents.slice(0, 2).map((event) => {
                        const isPast = new Date(event.datetime) < new Date();
                        const customStyle = !isPast && event.color
                          ? { backgroundColor: `${event.color}18`, borderColor: `${event.color}30`, color: event.color }
                          : undefined;
                        return (
                          <div
                            key={event.id}
                            className={cn(
                              "flex flex-col items-start gap-0.5 rounded px-1.5 py-1 text-[10px] leading-tight font-medium overflow-hidden border",
                              !customStyle && (isPast
                                ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                                : event.isDeadline
                                  ? "bg-orange-500/5 text-orange-600 dark:text-orange-400 border-orange-500/10"
                                  : "bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/10")
                            )}
                            style={customStyle}
                          >
                            <p className={cn("font-semibold truncate w-full", isPast && "line-through opacity-80")}>
                              {event.isDeadline && "⚠️ "}{event.name}
                            </p>
                            <p className="opacity-80 scale-95 origin-left truncate w-full">
                              {event.time} {isPast && "(Terlewat)"}
                            </p>
                          </div>
                        )
                      })}
                      {coloredDayEvents.length > 2 && (
                        <div className="text-[9px] px-1.5 font-bold text-muted-foreground leading-tight">
                          + {coloredDayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Mobile simplified calendar view list */}
            <div className="grid w-full grid-cols-7 grid-rows-6 lg:hidden">
              {days.map((day, dayIdx) => {
                const dayEventsData = data.find((date) => isSameDay(date.day, day))
                const dayEvents = dayEventsData ? [...dayEventsData.events].sort((a, b) => a.time.localeCompare(b.time)) : []
                let mobileColorIdx = 0
                const coloredMobileEvents = dayEvents.map((event) => {
                  if (!event.color && !event.isDeadline) {
                    const autoColor = EVENT_AUTO_COLORS[mobileColorIdx % EVENT_AUTO_COLORS.length]
                    mobileColorIdx++
                    return { ...event, color: autoColor }
                  }
                  return event
                })
                const isDaySelected = isEqual(day, selectedDay)
                const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth)
                return (
                  <button
                    onClick={() => setSelectedDay(day)}
                    key={dayIdx}
                    type="button"
                    className={cn(
                      "flex h-11 flex-col items-center justify-between border-b border-r border-border p-1 hover:bg-muted/40 focus:z-10 transition-colors relative",
                      !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                      isDaySelected && "bg-primary/5 border-primary/25"
                    )}
                  >
                    <time
                      dateTime={format(day, "yyyy-MM-dd")}
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                        isToday(day) && !isDaySelected && "bg-red-500/15 text-red-500",
                        isDaySelected && isToday(day) && "bg-primary text-primary-foreground",
                        isDaySelected && !isToday(day) && "bg-foreground text-background",
                      )}
                    >
                      {format(day, "d")}
                    </time>
                    {coloredMobileEvents.length > 0 && (
                      <div className="flex gap-0.5 justify-center mt-1">
                        {coloredMobileEvents.slice(0, 3).map((event) => {
                          const isPast = new Date(event.datetime) < new Date();
                          return (
                            <span
                              key={event.id}
                              className={cn(
                                "h-1 w-1 rounded-full",
                                isPast ? "bg-red-500" : ""
                              )}
                              style={!isPast && event.color ? { backgroundColor: event.color } : (!isPast ? { backgroundColor: event.isDeadline ? '#f97316' : '#3b82f6' } : undefined)}
                            />
                          )
                        })}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Selected Day Agenda panel — only for Calendar Schedule, not Deadline Calendar */}
        {!fullPage && (
          <div className="p-4 flex flex-col bg-muted/5 border-t border-border">
            <div className="pb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span>Agenda for {format(selectedDay, "MMM d, yyyy")}</span>
              </h3>
              {isToday(selectedDay) && (
                <span className="text-[10px] text-green-600 dark:text-green-400 font-bold bg-green-500/5 px-2 py-0.5 rounded border border-green-500/15 mt-1 inline-block">
                  Today
                </span>
              )}
            </div>

            <div className="flex-1 py-4 space-y-3">
              {selectedDayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <CalendarDays className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-medium">No events on this day.</p>
                </div>
              ) : (
                selectedDayEvents.map((event) => {
                  const isPast = new Date(event.datetime) < new Date();
                  const agendaStyle = !isPast && event.color
                    ? { backgroundColor: `${event.color}10`, borderColor: `${event.color}25` }
                    : undefined;
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "relative flex items-center gap-3 p-2.5 rounded-lg border group animate-in slide-in-from-bottom-1 duration-150 transition-colors",
                        !agendaStyle && (isPast
                          ? "bg-red-500/10 hover:bg-red-500/15 border-red-500/20"
                          : event.isDeadline
                            ? "bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/10"
                            : "bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/10")
                      )}
                      style={agendaStyle}
                    >
                      <div className="space-y-1 flex-1">
                        <p className={cn("text-xs font-bold text-foreground truncate", isPast && "line-through opacity-70")}>
                          {event.isDeadline ? "🔗 " : ""}{event.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full inline-block",
                              !event.color && (isPast ? "bg-red-500" : (event.isDeadline ? "bg-orange-500" : "bg-blue-500"))
                            )}
                            style={event.color && !isPast ? { backgroundColor: event.color } : undefined}
                          />
                          {event.time} {event.isDeadline && "(Deadline)"} {isPast && <span className="text-red-500 ml-1">(Terlewat)</span>}
                        </p>
                      </div>

                      {!event.isDeadline && onEditEvent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-full"
                          onClick={() => handleOpenEditEvent(event)}
                          title="Edit Event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {!event.isDeadline && onDeleteEvent && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded-full"
                          onClick={() => onDeleteEvent(event.id)}
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dialog overlay for New Event */}
      {isAddingEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Add New Event</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAddingEvent(false)} className="h-7 w-7 rounded-full">
                <X className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
            <form onSubmit={handleSubmitEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Planning sync, Gym, Study session..."
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="w-full text-xs rounded-md border border-input bg-background/50 px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Date</label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full text-xs rounded-md border border-input bg-background/50 px-2 py-2 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Time</label>
                  <input
                    type="time"
                    required
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full text-xs rounded-md border border-input bg-background/50 px-2 py-2 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full text-xs h-9 font-semibold text-primary-foreground mt-4">
                Create Event
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Dialog overlay for Edit Event */}
      {isEditingEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Edit Event</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsEditingEvent(false)} className="h-7 w-7 rounded-full">
                <X className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Event Name</label>
                <input
                  type="text"
                  required
                  value={editEventName}
                  onChange={(e) => setEditEventName(e.target.value)}
                  className="w-full text-xs rounded-md border border-input bg-background/50 px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Date</label>
                  <input
                    type="date"
                    required
                    value={editEventDate}
                    onChange={(e) => setEditEventDate(e.target.value)}
                    className="w-full text-xs rounded-md border border-input bg-background/50 px-2 py-2 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Time</label>
                  <input
                    type="time"
                    required
                    value={editEventTime}
                    onChange={(e) => setEditEventTime(e.target.value)}
                    className="w-full text-xs rounded-md border border-input bg-background/50 px-2 py-2 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full text-xs h-9 font-semibold text-primary-foreground mt-4">
                Save Changes
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
