'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import {
  addDays, addMonths, chicagoToday, chicagoZoneAbbreviation, formatDateLabel, formatMonthLabel,
  instantToWall, isSkippedWallTime, monthGrid, parseIsoDate, serializeWall, wallOffset,
} from '@/lib/admin-date'
import { AdminIcon } from './AdminIcon'

type DatePickerProps = {
  /** Form field name; the value posts through a hidden input under this name. */
  name: string
  label: string
  /** "YYYY-MM-DD", or with `withTime` a stored instant (any offset). */
  defaultValue?: string | null
  /** Adds a time input; the value posts as Chicago ISO with offset, e.g. 2026-12-05T09:00:00-06:00. */
  withTime?: boolean
  /** Hides the Clear button. Required-ness itself is enforced by the server action. */
  required?: boolean
  className?: string
}

const WEEKDAYS = [['Su', 'Sunday'], ['Mo', 'Monday'], ['Tu', 'Tuesday'], ['We', 'Wednesday'], ['Th', 'Thursday'], ['Fr', 'Friday'], ['Sa', 'Saturday']]

function weekday(value: string): number {
  const parts = parseIsoDate(value)
  return parts ? new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay() : 0
}

/**
 * Calendar date (and optional time) field for admin forms.
 *
 * The calendar opens inline below the field rather than floating, so it isn't
 * clipped inside the collapsible `<details>` rows. It emits the same strings the
 * old hand-typed inputs expected, so server validation is unchanged. AdminForm
 * remounts after a successful save, which resets this field to the saved value.
 */
export function DatePicker({ name, label, defaultValue, withTime = false, required = false, className = '' }: DatePickerProps) {
  const initial = withTime ? instantToWall(defaultValue) : { date: parseIsoDate(defaultValue || '') ? defaultValue! : '', time: '' }
  const [date, setDate] = useState(initial.date)
  const [time, setTime] = useState(initial.time)
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState('')
  const moveFocus = useRef(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const timeInput = useRef<HTMLInputElement>(null)
  const id = useId()

  const value = withTime ? serializeWall({ date, time }) : date
  const today = open ? chicagoToday() : ''
  const view = parseIsoDate(focus) ?? { year: 2026, month: 1, day: 1 }

  useEffect(() => {
    if (!open) return
    function outside(event: MouseEvent) {
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

  function show() {
    moveFocus.current = true
    setFocus(date || chicagoToday())
    setOpen(true)
  }

  function close() {
    setOpen(false)
    trigger.current?.focus()
  }

  function pick(next: string) {
    setDate(next)
    setOpen(false)
    // Picking a date for a timed field with no time yet goes straight to the time.
    if (withTime && !time) timeInput.current?.focus()
    else trigger.current?.focus()
  }

  function clear() {
    setDate('')
    setTime('')
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
    setFocus(step())
  }

  const offset = withTime && date && time ? wallOffset(date, time) : ''
  const warning = !withTime || (!date && !time) ? ''
    : !date ? 'Pick a date too, or clear the time.'
    : !time ? 'Add a time too, or clear the date.'
    : isSkippedWallTime(date, time) ? 'Clocks spring forward that night, so this time doesn\'t exist in Chicago. Pick 3:00 AM or later.'
    : ''

  return (
    <div ref={root} role="group" aria-labelledby={`${id}-label`} className={`admin-date-field ${className}`}>
      <span id={`${id}-label`} className="admin-date-label">{label}</span>
      <input type="hidden" name={name} value={value} />
      <div className={withTime ? 'admin-date-controls admin-date-controls-time' : 'admin-date-controls'}>
        <button
          ref={trigger}
          type="button"
          className="admin-date-trigger"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? `${id}-panel` : undefined}
          aria-label={`${label}: ${date ? formatDateLabel(date) : 'no date'}. Choose date`}
          onClick={() => (open ? close() : show())}
        >
          <AdminIcon name="calendar" width={18} height={18} />
          <span className={date ? '' : 'text-neutral-400'}>{date ? formatDateLabel(date) : 'Pick a date'}</span>
        </button>
        {withTime && (
          <input ref={timeInput} type="time" aria-label={`${label} time`} value={time} onChange={event => setTime(event.target.value)} />
        )}
      </div>
      {(offset || (!required && (date || time))) && (
        <p className="admin-date-meta">
          {offset && <span>Chicago time ({chicagoZoneAbbreviation(offset)})</span>}
          {!required && (date || time) && <button type="button" className="admin-date-link" onClick={clear}>Clear</button>}
        </p>
      )}
      {warning && <p className="admin-date-warning" role="status">{warning}</p>}
      {open && (
        <div
          id={`${id}-panel`}
          role="dialog"
          aria-label={`Choose ${label}`}
          className="admin-date-panel"
          onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); close() } }}
        >
          <div className="admin-date-header">
            <button type="button" className="admin-date-nav" aria-label="Previous month" onClick={() => setFocus(addMonths(focus, -1))}>
              <AdminIcon name="arrow" width={16} height={16} className="rotate-180" />
            </button>
            <span className="admin-date-month" aria-live="polite">{formatMonthLabel(view.year, view.month)}</span>
            <button type="button" className="admin-date-nav" aria-label="Next month" onClick={() => setFocus(addMonths(focus, 1))}>
              <AdminIcon name="arrow" width={16} height={16} />
            </button>
          </div>
          <table role="grid" className="admin-date-grid" aria-label={formatMonthLabel(view.year, view.month)}>
            <thead>
              <tr>{WEEKDAYS.map(([short, long]) => <th key={short} scope="col" abbr={long}>{short}</th>)}</tr>
            </thead>
            <tbody>
              {monthGrid(view.year, view.month).map((week, row) => (
                <tr key={row}>
                  {week.map((day, col) => (
                    <td key={col}>
                      {day && (
                        <button
                          type="button"
                          data-date={day}
                          tabIndex={day === focus ? 0 : -1}
                          aria-label={formatDateLabel(day)}
                          aria-pressed={day === date}
                          aria-current={day === today ? 'date' : undefined}
                          onClick={() => pick(day)}
                          onKeyDown={gridKey}
                        >
                          {Number(day.slice(8))}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="admin-date-footer">
            <button type="button" className="admin-date-link" onClick={() => pick(today)}>Today</button>
            <button type="button" className="admin-date-link" onClick={close}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
