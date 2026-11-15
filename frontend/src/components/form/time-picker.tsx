import { Check, Clock3, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import { PickerField, type PickerFieldProps } from './picker-field';
import { usePreferences } from '@/store/use-preferences';

function TimeColumn({
    label,
    value,
    count,
    onChange,
    twelveHour = false,
}: {
    label: string;
    value: number;
    count: number;
    onChange: (value: number) => void;
    twelveHour?: boolean;
}) {
    const listRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const list = listRef.current!;
        const selected = list.querySelector<HTMLElement>('[aria-checked="true"]')!;
        list.scrollTop = selected.offsetTop - (list.clientHeight - selected.clientHeight) / 2;
    }, [value]);
    return (
        <div className="min-w-0">
            <p className="mb-2 text-center text-[9px] font-semibold tracking-[0.12em] text-slate-400">
                {label.toUpperCase()}
            </p>
            <div
                ref={listRef}
                role="radiogroup"
                aria-label={label}
                className="relative grid h-40 [scrollbar-width:thin] gap-1 overflow-y-auto overscroll-contain rounded-xl border border-slate-200/70 bg-white p-1.5"
            >
                {Array.from({ length: count }, (_, option) => (
                    <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={option === value}
                        tabIndex={option === value ? 0 : -1}
                        onClick={() => onChange(option)}
                        onKeyDown={(event) => {
                            if (
                                ![
                                    'ArrowUp',
                                    'ArrowDown',
                                    'ArrowLeft',
                                    'ArrowRight',
                                    'Home',
                                    'End',
                                ].includes(event.key)
                            )
                                return;
                            event.preventDefault();
                            event.stopPropagation();
                            const next =
                                event.key === 'Home'
                                    ? 0
                                    : event.key === 'End'
                                      ? count - 1
                                      : (option +
                                            (event.key === 'ArrowUp' || event.key === 'ArrowLeft'
                                                ? -1
                                                : 1) +
                                            count) %
                                        count;
                            onChange(next);
                            const options =
                                event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>(
                                    'button'
                                );
                            options[next].focus({ preventScroll: true });
                        }}
                        className={cn(
                            'flow-control flex min-h-9 items-center justify-center rounded-lg border border-transparent text-xs text-slate-400 tabular-nums outline-none',
                            value === option &&
                                'border-primary/40 bg-primary/15 text-primary-foreground font-medium'
                        )}
                    >
                        {String(twelveHour && option === 0 ? 12 : option).padStart(2, '0')}
                    </button>
                ))}
            </div>
        </div>
    );
}

function ClockPicker({ value, onSelect }: { value: string; onSelect: (value: string) => void }) {
    const hourCycle = usePreferences((state) => state.hourCycle);
    const [hour, setHour] = useState(() => (value ? Number(value.slice(0, 2)) : 9));
    const [minute, setMinute] = useState(() => (value ? Number(value.slice(3, 5)) : 0));
    const selected = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return (
        <>
            <div className="surface-wash border-primary/15 border-b p-4">
                <div className="mb-3 flex items-center gap-2 text-[10px] text-slate-400">
                    <Clock3 size={14} />
                    Find the right moment
                </div>
                <div className="flex items-center gap-3">
                    <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white bg-white/70">
                        <svg
                            viewBox="0 0 40 40"
                            aria-hidden="true"
                            className="text-primary-foreground size-9"
                        >
                            <circle
                                cx="20"
                                cy="20"
                                r="16"
                                fill="none"
                                stroke="#8ecae6"
                                strokeWidth="1.5"
                            />
                            <line
                                x1="20"
                                y1="20"
                                x2="20"
                                y2="11"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                transform={`rotate(${(hour % 12) * 30 + minute / 2} 20 20)`}
                            />
                            <line
                                x1="20"
                                y1="20"
                                x2="20"
                                y2="7"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                transform={`rotate(${minute * 6} 20 20)`}
                            />
                            <circle cx="20" cy="20" r="2" fill="currentColor" />
                        </svg>
                    </span>
                    <div>
                        <p className="text-primary-foreground text-[25px] leading-none font-medium tracking-tight tabular-nums">
                            {formatTime(selected)}
                        </p>
                        <p className="mt-1.5 text-[9px] text-slate-400">
                            {hourCycle === 'h12' ? '12-hour time' : '24-hour time'}
                        </p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
                <TimeColumn
                    label="Hour"
                    value={hourCycle === 'h12' ? hour % 12 : hour}
                    count={hourCycle === 'h12' ? 12 : 24}
                    twelveHour={hourCycle === 'h12'}
                    onChange={(value) =>
                        setHour(hourCycle === 'h12' ? value + (hour >= 12 ? 12 : 0) : value)
                    }
                />
                <TimeColumn label="Minute" value={minute} count={60} onChange={setMinute} />
                {hourCycle === 'h12' && (
                    <div className="col-span-2 flex gap-2">
                        {['AM', 'PM'].map((label, index) => (
                            <Button
                                key={label}
                                type="button"
                                variant={Math.floor(hour / 12) === index ? 'default' : 'outline'}
                                className="h-9 flex-1 rounded-xl text-xs"
                                aria-pressed={Math.floor(hour / 12) === index}
                                onClick={() => setHour((hour % 12) + index * 12)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-slate-200/70 p-3">
                <Button
                    type="button"
                    variant="ghost"
                    disabled={!value}
                    onClick={() => onSelect('')}
                    className="h-8 gap-1.5 rounded-lg px-2 text-[10px]"
                >
                    <RotateCcw size={11} />
                    Clear time
                </Button>
                <Button
                    type="button"
                    onClick={() => onSelect(selected)}
                    className="bg-brand h-9 gap-2 rounded-xl text-[11px] text-white"
                >
                    <Check size={13} />
                    Set time
                </Button>
            </div>
        </>
    );
}

export function TimePicker({ onChange, ...props }: PickerFieldProps) {
    usePreferences((state) => state.hourCycle);
    return (
        <PickerField
            {...props}
            icon={Clock3}
            variant="time"
            displayValue={props.value ? formatTime(props.value) : ''}
            placeholder="Pick a time"
        >
            {(close) => (
                <ClockPicker
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
