import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
    addDays,
    todayDate,
    calendarMonthStart,
    calendarParts,
    formatCalendarDate,
    shiftCalendarMonth,
    weekLabels,
} from '@/lib/date';
import { usePreferences } from '@/store/use-preferences';
import { cn } from '@/lib/utils';
import { PickerField, type PickerFieldProps } from './picker-field';

function Calendar({ value, onSelect }: { value: string; onSelect: (value: string) => void }) {
    const today = todayDate();
    const { weekStart, calendar } = usePreferences();
    const [focused, setFocused] = useState(value || today);
    const [monthDay, setMonth] = useState(value || today);
    const month = calendarMonthStart(monthDay);
    const focusedRef = useRef<HTMLButtonElement>(null);
    const start = addDays(month, -((new Date(`${month}T12:00:00`).getDay() - weekStart + 7) % 7));

    useEffect(() => {
        focusedRef.current?.focus({ preventScroll: true });
    }, [focused]);

    const focusDay = (day: string) => {
        setFocused(day);
        setMonth(day);
    };
    const shiftMonth = (amount: number) => {
        focusDay(shiftCalendarMonth(focused, amount));
    };
    const navigate = (event: KeyboardEvent<HTMLButtonElement>, day: string) => {
        const offsets: Record<string, number> = {
            ArrowLeft: -1,
            ArrowRight: 1,
            ArrowUp: -7,
            ArrowDown: 7,
        };
        if (event.key in offsets) {
            event.preventDefault();
            event.stopPropagation();
            focusDay(addDays(day, offsets[event.key]));
        } else if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            event.stopPropagation();
            const weekday = (new Date(`${day}T12:00:00`).getDay() - weekStart + 7) % 7;
            focusDay(addDays(day, event.key === 'Home' ? -weekday : 6 - weekday));
        } else if (event.key === 'PageUp' || event.key === 'PageDown') {
            event.preventDefault();
            event.stopPropagation();
            shiftMonth((event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1));
        }
    };

    return (
        <>
            <div className="surface-wash border-primary/15 border-b p-4">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-medium text-slate-400">
                    <CalendarDays size={14} />A little room in your day
                </div>
                <div className="flex items-center justify-between gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Previous month"
                        onClick={() => shiftMonth(-1)}
                        className="size-8 rounded-lg bg-white/80"
                    >
                        <ChevronLeft size={15} />
                    </Button>
                    <span
                        aria-live="polite"
                        className="text-primary-foreground text-[13px] font-semibold"
                    >
                        {formatCalendarDate(month, { month: 'long', year: 'numeric' })}
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Next month"
                        onClick={() => shiftMonth(1)}
                        className="size-8 rounded-lg bg-white/80"
                    >
                        <ChevronRight size={15} />
                    </Button>
                </div>
            </div>
            <div className="p-3">
                <div className="mb-3 grid grid-cols-2 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onSelect(today)}
                        className="rounded-xl text-[10px]"
                    >
                        Today
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onSelect(addDays(today, 1))}
                        className="rounded-xl text-[10px]"
                    >
                        Tomorrow
                    </Button>
                </div>
                <div
                    role="grid"
                    aria-label={formatCalendarDate(month, { month: 'long', year: 'numeric' })}
                    className="grid gap-1"
                >
                    <div role="row" className="grid grid-cols-7">
                        {weekLabels().map((day) => (
                            <span
                                key={day}
                                role="columnheader"
                                className="py-2 text-center text-[9px] font-medium text-slate-400"
                            >
                                {day}
                            </span>
                        ))}
                    </div>
                    {Array.from({ length: 6 }, (_, week) => (
                        <div key={week} role="row" className="grid grid-cols-7 gap-1">
                            {Array.from({ length: 7 }, (_, weekday) => {
                                const day = addDays(start, week * 7 + weekday);
                                return (
                                    <div key={day} role="gridcell" aria-selected={day === value}>
                                        <button
                                            ref={day === focused ? focusedRef : undefined}
                                            type="button"
                                            tabIndex={day === focused ? 0 : -1}
                                            aria-label={formatCalendarDate(day, {
                                                dateStyle: 'full',
                                            })}
                                            aria-current={day === today ? 'date' : undefined}
                                            onFocus={() => setFocused(day)}
                                            onClick={() => onSelect(day)}
                                            onKeyDown={(event) => navigate(event, day)}
                                            className={cn(
                                                'flow-control flex aspect-square w-full items-center justify-center rounded-xl border border-transparent text-[11px] text-slate-600 tabular-nums outline-none',
                                                calendarMonthStart(day) !== month &&
                                                    'text-slate-300',
                                                day === today &&
                                                    'border-primary/40 text-primary-foreground font-semibold',
                                                day === value &&
                                                    'bg-brand font-medium text-white shadow-sm'
                                            )}
                                        >
                                            {new Intl.NumberFormat(
                                                calendar === 'persian' ? 'fa-IR' : 'en-US'
                                            ).format(calendarParts(day).day)}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200/70 px-4 py-3">
                <span className="text-[9px] text-slate-400">Plan at your own pace.</span>
                <Button
                    type="button"
                    variant="ghost"
                    disabled={!value}
                    onClick={() => onSelect('')}
                    className="h-7 gap-1.5 rounded-lg px-2 text-[10px]"
                >
                    <RotateCcw size={11} />
                    Clear date
                </Button>
            </div>
        </>
    );
}

export function DatePicker({ onChange, ...props }: PickerFieldProps) {
    usePreferences((state) => state.calendar);
    const displayValue = props.value
        ? formatCalendarDate(props.value, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : '';
    return (
        <PickerField
            {...props}
            icon={CalendarDays}
            variant="date"
            displayValue={displayValue}
            placeholder="Pick a day"
        >
            {(close) => (
                <Calendar
                    value={props.value}
                    onSelect={(value) => {
                        onChange(value);
                        close();
                    }}
                />
            )}
        </PickerField>
    );
}
