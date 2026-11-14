import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, Waves } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/store/use-preferences';

export function FocusSession() {
    const defaultMinutes = usePreferences((state) => state.focusMinutes);
    const [minutes, setMinutes] = useState(String(defaultMinutes));
    const [durationMinutes, setDurationMinutes] = useState(defaultMinutes);
    const [remaining, setRemaining] = useState(defaultMinutes * 60);
    const [end, setEnd] = useState<number | null>(null);
    const [started, setStarted] = useState(false);
    useEffect(() => {
        if (end === null) return;
        const tick = () => {
            const seconds = Math.max(0, Math.ceil((end - Date.now()) / 1000));
            setRemaining(seconds);
            if (!seconds) {
                setEnd(null);
                toast.add({
                    type: 'success',
                    title: 'Focus session complete',
                    description: 'Nice work. Take a short break—you earned it.',
                });
            }
        };
        const interval = setInterval(tick, 250);
        return () => clearInterval(interval);
    }, [end]);
    const time = `${Math.floor(remaining / 60)
        .toString()
        .padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`;
    const progress = remaining / (durationMinutes * 60);
    const status =
        end !== null ? 'In the flow' : !remaining ? 'Well done' : started ? 'Paused' : 'Ready';
    const setDuration = (value: number) => {
        setMinutes(String(value));
        setDurationMinutes(value);
        setRemaining(value * 60);
        setStarted(false);
    };
    return (
        <Card
            variant="ghost"
            className="surface-focus text-primary-foreground relative overflow-hidden rounded-[22px] border border-slate-200/80 py-5 shadow-[0_4px_24px_-16px_#02304720]"
        >
            <CardContent className="px-5">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-primary-foreground flex size-8 items-center justify-center rounded-xl border border-white bg-white/80">
                            <Waves size={16} strokeWidth={1.6} />
                        </span>
                        <h2 className="text-[13px] font-semibold">Focus session</h2>
                    </div>
                    <span
                        role="status"
                        className="flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/70 px-2 py-1 text-[9px] text-slate-400"
                    >
                        <span
                            className={cn(
                                'size-1 shrink-0 rounded-full bg-slate-300',
                                end !== null && 'bg-brand',
                                started && end === null && remaining > 0 && 'bg-secondary',
                                !remaining && 'bg-emerald-500'
                            )}
                        />
                        {status}
                    </span>
                </div>
                <p className="mt-4 text-center text-[11px] text-slate-400">
                    Give one thing your full attention.
                </p>
                <div className="relative mx-auto my-4 flex size-48 items-center justify-center">
                    <svg
                        viewBox="0 0 200 200"
                        aria-hidden="true"
                        className="absolute inset-0 size-full -rotate-90"
                    >
                        <circle
                            cx="100"
                            cy="100"
                            r="86"
                            fill="none"
                            stroke="var(--input)"
                            strokeWidth="5"
                        />
                        <circle
                            cx="100"
                            cy="100"
                            r="76"
                            fill="var(--wash-start)"
                            fillOpacity="0.65"
                            stroke="var(--card)"
                        />
                        <circle
                            cx="100"
                            cy="100"
                            r="86"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 86}
                            strokeDashoffset={2 * Math.PI * 86 * (1 - progress)}
                            className="text-primary transition-[stroke-dashoffset] duration-700 ease-linear motion-reduce:transition-none"
                        />
                    </svg>
                    <div className="relative text-center">
                        <span className="mb-2 block text-[8px] font-medium tracking-[0.17em] text-slate-400">
                            {end !== null
                                ? 'JUST THIS MOMENT'
                                : !remaining
                                  ? 'A LITTLE PROGRESS'
                                  : 'FIND YOUR FLOW'}
                        </span>
                        <div
                            role="timer"
                            aria-label="Focus time remaining"
                            className="text-[42px] leading-none font-medium tracking-[-0.06em] tabular-nums"
                        >
                            {time}
                        </div>
                        <span className="mt-2 block text-[9px] text-slate-400">
                            {end !== null
                                ? 'One small step at a time'
                                : !remaining
                                  ? 'Take a well-earned breath'
                                  : started
                                    ? 'Continue when you’re ready'
                                    : 'A little space to focus'}
                        </span>
                    </div>
                </div>
                <div
                    className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100/70 p-1"
                    aria-label="Focus duration presets"
                >
                    {[15, 25, 50].map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            disabled={end !== null}
                            aria-pressed={durationMinutes === preset}
                            onClick={() => setDuration(preset)}
                            className={cn(
                                'flow-control rounded-lg border border-transparent px-2 py-2 text-[10px] text-slate-400 outline-none disabled:cursor-not-allowed disabled:opacity-50',
                                durationMinutes === preset &&
                                    'text-primary-foreground bg-white font-medium shadow-sm'
                            )}
                        >
                            {preset} min
                        </button>
                    ))}
                </div>
                <label className="mt-3 flex items-center justify-between gap-3 text-[10px] text-slate-400">
                    Your own pace
                    <span className="flex items-center gap-1.5">
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={3}
                            aria-label="Focus session duration in minutes"
                            title="Changing the duration resets the timer"
                            value={minutes}
                            disabled={end !== null}
                            className="flow-control text-primary-foreground h-7 w-12 rounded-lg border border-slate-200 bg-white px-1.5 text-center text-[11px] tabular-nums outline-none disabled:opacity-50"
                            onChange={(event) => {
                                const value = event.target.value;
                                if (!/^\d{0,3}$/.test(value)) return;
                                setMinutes(value);
                                const next = Number(value);
                                if (!Number.isInteger(next) || next < 1 || next > 999) return;
                                setDurationMinutes(next);
                                setRemaining(next * 60);
                                setStarted(false);
                            }}
                            onBlur={() => setMinutes(String(durationMinutes))}
                            onKeyDown={(event) => {
                                if (
                                    ['.', ',', 'e', 'E', '+', '-'].includes(event.key) &&
                                    !event.ctrlKey &&
                                    !event.metaKey
                                ) {
                                    event.preventDefault();
                                }
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    event.currentTarget.blur();
                                }
                            }}
                            onPaste={(event) => {
                                if (!/^\d{1,3}$/.test(event.clipboardData.getData('text'))) {
                                    event.preventDefault();
                                }
                            }}
                        />
                        min
                    </span>
                </label>
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                    <Button
                        className="bg-brand h-10 min-w-0 flex-1 gap-2 rounded-xl text-xs font-medium text-white shadow-[0_4px_10px_-5px_#02304740]"
                        onClick={() => {
                            if (end !== null) {
                                setRemaining(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
                                setEnd(null);
                                toast.add({
                                    type: 'info',
                                    title: 'Focus session paused',
                                    description: 'Continue whenever you are ready.',
                                });
                            } else {
                                toast.add({
                                    type: 'success',
                                    title:
                                        started && remaining
                                            ? 'Focus session resumed'
                                            : 'Focus session started',
                                    description: 'Time to focus on one thing at a time.',
                                });
                                setStarted(true);
                                const next = remaining || durationMinutes * 60;
                                setRemaining(next);
                                setEnd(Date.now() + next * 1000);
                            }
                        }}
                    >
                        {end !== null ? <Pause size={16} /> : <Play size={16} />}
                        {end !== null
                            ? 'Pause session'
                            : started && remaining
                              ? 'Continue session'
                              : 'Start focus'}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Reset focus timer"
                        title="Reset timer"
                        disabled={!started}
                        className="size-10 shrink-0 rounded-xl border border-slate-200 bg-white text-slate-400"
                        onClick={() => {
                            setEnd(null);
                            setRemaining(durationMinutes * 60);
                            setStarted(false);
                            toast.add({
                                type: 'info',
                                title: 'Timer reset',
                                description: `Your timer is back to ${durationMinutes} ${durationMinutes === 1 ? 'minute' : 'minutes'}.`,
                            });
                        }}
                    >
                        <RotateCcw size={15} />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
