'use client'

import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react'
import {
  addDays, addMonths, chicagoToday, chicagoZoneAbbreviation, clampDate, formatDateLabel, formatMonthLabel,
  isInRange, isSkippedWallTime, monthEdges, monthGrid, parseFormValue, parseIsoDate, serializeValue,
  wallOffset, type WallDateTime,
} from '@/lib/calendar-date'

type DatePickerProps = {
  label: string
  /** Visually hides the label (it stays available to screen readers), e.g. in a compact filter bar. */
  hideLabel?: boolean
  /** Form field name. With a name the value posts through a hidden input, so GET filter forms and server actions both work. */
  name?: string
  /** Controlled value, in the same format the field posts. Pair with `onChange`. */
  value?: string
  /** Uncontrolled starting value: "YYYY-MM-DD", or with `withTime` a stored instant (any offset). */
  defaultValue?: string | null
  /** Called with the new value: "YYYY-MM-DD", or with `withTime` Chicago ISO such as 2026-12-05T09:00:00-06:00 ("" when cleared). */
  onChange?: (value: string) => void
  /** Adds a time input. */
  withTime?: boolean
  /** Hides the Clear button. Admin forms still enforce required-ness on the server. */
  required?: boolean
  disabled?: boolean
  /** Inclusive "YYYY-MM-DD" bounds. Days outside them can't be picked; use one picker's value as the other's bound for a range. */
  min?: string
  max?: string
  /**
   * "inline" (default) opens the calendar in the page flow, which is never clipped
   * (admin `<details>` rows hide overflow). "popover" floats it over the content,
   * for filter and sort bars.
   */
  placement?: 'inline' | 'popover'
  placeholder?: string
  className?: string
}

const WEEKDAYS = [['Su', 'Sunday'], ['Mo', 'Monday'], ['Tu', 'Tuesday'], ['We', 'Wednesday'], ['Th', 'Thursday'], ['Fr', 'Friday'], ['Sa', 'Saturday']]

// Like ui/Input, inherits font size and line height so it lines up with the inputs beside it.
const FIELD = 'mt-1.5 rounded-xl border border-neutral-300 bg-neutral-0 px-4 py-2.5 text-neutral-950 shadow-sm transition-colors hover:border-neutral-400 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:cursor-not-allowed disabled:opacity-60'
const LINK = 'rounded font-semibold text-brand-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline'
const NAV = 'inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 aria-disabled:cursor-not-allowed aria-disabled:opacity-30 aria-disabled:hover:bg-transparent'

function weekday(value: string): number {
  const parts = parseIsoDate(value)
  return parts ? new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay() : 0
}

function CalendarIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className="shrink-0 text-brand-700">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  )
}

function Chevron({ flip = false }: { flip?: boolean }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={flip ? 'rotate-180' : ''}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

/**
 * Calendar date (and optional time) field, shared by admin forms and public pages.
 *
 * Admin form: `<DatePicker name="preached_at" label="Preached date" required defaultValue={item?.preached_at} />`
 * Timed admin field: add `withTime`; it posts Chicago ISO with the DST-correct offset.
 * GET filter form: `<DatePicker name="from" label="From" placement="popover" defaultValue={searchParams.from} />`
 * Client filter: `<DatePicker label="From" value={from} onChange={setFrom} max={to || undefined} placement="popover" />`
 *
 * Dates are Chicago calendar dates and "Today" is Chicago's today. AdminForm
 * remounts after a successful save, which resets an uncontrolled picker to the saved value.
 */
export function DatePicker({
  label, hideLabel = false, name, value, defaultValue, onChange, withTime = false, required = false,
  disabled = false, min, max, placement = 'inline', placeholder = 'Pick a date', className = '',
}: DatePickerProps) {
  const controlled = value !== undefined
  const [inner, setInner] = useState(() => parseFormValue(defaultValue, withTime))
  const { date, time } = controlled ? parseFormValue(value, withTime) : inner
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState('')
  const moveFocus = useRef(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const timeInput = useRef<HTMLInputElement>(null)
  const id = useId()

  const today = open ? chicagoToday() : ''
  const view = parseIsoDate(focus) ?? { year: 2026, month: 1, day: 1 }
  const edges = monthEdges(focus)
  const canPrevious = isInRange(edges.previousEnd, min)
  const canNext = isInRange(edges.nextStart, undefined, max)

  useEffect(() => {
    if (!open) return
    function outside(event: globalThis.MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [open])

  useEffect(() => {
    if (!open || !moveFocus.current) return
    moveFocus.current = false
    root.current?.querySelector<HTMLButtonElement>(`[data-date="${focus}"]`)?.focus()
  }, [open, focus])

  function update(next: WallDateTime) {
    if (!controlled) setInner(next)
    onChange?.(serializeValue(next, withTime))
  }

  function show() {
    moveFocus.current = true
    setFocus(clampDate(date || chicagoToday(), min, max))
    setOpen(true)
  }

  function close() {
    setOpen(false)
    trigger.current?.focus()
  }

  function pick(next: string) {
    if (!isInRange(next, min, max)) return
    update({ date: next, time })
    setOpen(false)
    // Picking a date for a timed field with no time yet goes straight to the time.
    if (withTime && !time) timeInput.current?.focus()
    else trigger.current?.focus()
  }

  function clear() {
    update({ date: '', time: '' })
    setOpen(false)
  }

  function gridKey(event: KeyboardEvent<HTMLButtonElement>) {
    const steps: Record<string, () => string> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      Home: () => addDays(focus, -weekday(focus)),
      End: () => addDays(focus, 6 - weekday(focus)),
      PageUp: () => addMonths(focus, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focus, event.shiftKey ? 12 : 1),
    }
    const step = steps[event.key]
    if (!step) return
    event.preventDefault()
    moveFocus.current = true
    setFocus(clampDate(step(), min, max))
  }

  // A floating calendar closes when focus moves to something outside the field; an
  // inline one stays put. Outside clicks are handled by the mousedown listener.
  function blur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget as Node | null
    if (placement === 'popover' && open && next && !root.current?.contains(next)) setOpen(false)
  }

  // Clicking the field's non-interactive parts (panel padding, headings) keeps focus
  // where it is. Otherwise focus jumps to a focusable ancestor, such as the
  // skip-link target <main tabIndex={-1}>, which reads as leaving the field.
  function keepFocus(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target as HTMLElement).closest('button, input')) event.preventDefault()
  }

  const offset = withTime && date && time ? wallOffset(date, time) : ''
  const warning = !withTime || (!date && !time) ? ''
    : !date ? 'Pick a date too, or clear the time.'
    : !time ? 'Add a time too, or clear the date.'
    : isSkippedWallTime(date, time) ? 'Clocks spring forward that night, so this time doesn\'t exist in Chicago. Pick 3:00 AM or later.'
    : ''
  const panelClass = placement === 'popover'
    ? 'absolute left-0 top-full z-30 mt-2 w-[20rem] max-w-[calc(100vw-2rem)]'
    : 'mt-2 w-full max-w-[20rem]'

  return (
    <div ref={root} role="group" aria-labelledby={`${id}-label`} onBlur={blur} onMouseDown={keepFocus} className={`relative ${className}`}>
      <span id={`${id}-label`} className={hideLabel ? 'sr-only' : 'block text-sm font-medium text-neutral-800'}>{label}</span>
      {name && <input type="hidden" name={name} value={serializeValue({ date, time }, withTime)} />}
      <div className={withTime ? 'flex flex-wrap gap-x-3' : ''}>
        <button
          ref={trigger}
          type="button"
          data-date-picker="trigger"
          disabled={disabled}
          className={`${FIELD} flex w-full items-center gap-2.5 text-left ${withTime ? 'flex-[3_1_13rem]' : ''}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? `${id}-panel` : undefined}
          aria-label={`${label}: ${date ? formatDateLabel(date) : 'no date'}. Choose date`}
          onClick={() => (open ? close() : show())}
        >
          <CalendarIcon />
          <span className={`whitespace-nowrap ${date ? '' : 'text-neutral-500'}`}>{date ? formatDateLabel(date) : placeholder}</span>
        </button>
        {withTime && (
          <input
            ref={timeInput}
            type="time"
            data-date-picker="time"
            disabled={disabled}
            aria-label={`${label} time`}
            value={time}
            onChange={event => update({ date, time: event.target.value })}
            className={`${FIELD} block w-full flex-[1_1_9rem]`}
          />
        )}
      </div>
      {(offset || (!required && !disabled && (date || time))) && (
        <p className="mt-1.5 flex items-center gap-3 text-xs text-neutral-600">
          {offset && <span>Chicago time ({chicagoZoneAbbreviation(offset)})</span>}
          {!required && !disabled && (date || time) && <button type="button" className={LINK} onClick={clear}>Clear</button>}
        </p>
      )}
      {warning && <p className="mt-1.5 text-xs font-medium text-amber-800" role="status">{warning}</p>}
      {open && (
        <div
          id={`${id}-panel`}
          role="dialog"
          aria-label={`Choose ${label}`}
          className={`${panelClass} rounded-xl border border-neutral-200 bg-neutral-0 p-3 shadow-soft`}
          onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); close() } }}
        >
          <div className="mb-2 flex items-center justify-between">
            <button type="button" className={NAV} aria-label="Previous month" aria-disabled={!canPrevious || undefined} onClick={() => canPrevious && setFocus(clampDate(addMonths(focus, -1), min, max))}>
              <Chevron flip />
            </button>
            <span className="font-display text-[15px] font-semibold text-brand-900" aria-live="polite">{formatMonthLabel(view.year, view.month)}</span>
            <button type="button" className={NAV} aria-label="Next month" aria-disabled={!canNext || undefined} onClick={() => canNext && setFocus(clampDate(addMonths(focus, 1), min, max))}>
              <Chevron />
            </button>
          </div>
          <table role="grid" className="w-full border-collapse text-center" aria-label={formatMonthLabel(view.year, view.month)}>
            <thead>
              <tr>{WEEKDAYS.map(([short, long]) => <th key={short} scope="col" abbr={long} className="pb-1 text-xs font-medium text-neutral-500">{short}</th>)}</tr>
            </thead>
            <tbody>
              {monthGrid(view.year, view.month).map((week, row) => (
                <tr key={row}>
                  {week.map((day, col) => {
                    if (!day) return <td key={col} className="p-0.5" />
                    const selected = day === date
                    const outside = !isInRange(day, min, max)
                    return (
                      <td key={col} className="p-0.5">
                        <button
                          type="button"
                          data-date={day}
                          tabIndex={day === focus ? 0 : -1}
                          aria-label={formatDateLabel(day)}
                          aria-pressed={selected}
                          aria-disabled={outside || undefined}
                          aria-current={day === today ? 'date' : undefined}
                          onClick={() => pick(day)}
                          onKeyDown={gridKey}
                          className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                            selected ? 'bg-brand-800 font-semibold text-white hover:bg-brand-700'
                            : outside ? 'cursor-not-allowed text-neutral-300'
                            : 'text-neutral-900 hover:bg-brand-50'
                          } ${day === today && !selected ? 'font-semibold text-brand-800 ring-1 ring-brand-300' : ''}`}
                        >
                          {Number(day.slice(8))}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex justify-between border-t border-neutral-200 px-1 pt-2 text-sm">
            <button type="button" className={LINK} disabled={!isInRange(today, min, max)} onClick={() => pick(today)}>Today</button>
            <button type="button" className={LINK} onClick={close}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
