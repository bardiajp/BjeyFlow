import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, Sprout } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DEFAULT_MINUTES = 25;

export function FocusSession() {
    const [minutes, setMinutes] = useState(String(DEFAULT_MINUTES));
    const [durationMinutes, setDurationMinutes] = useState(DEFAULT_MINUTES);
    const [remaining, setRemaining] = useState(DEFAULT_MINUTES * 60);
    const [end, setEnd] = useState<number | null>(null);
    const [started, setStarted] = useState(false);
    useEffect(() => {
        if (end === null) return;
        const tick = () => {
            const seconds = Math.max(0, Math.ceil((end - Date.now()) / 1000));
            setRemaining(seconds);
            if (!seconds) setEnd(null);
        };
        const interval = setInterval(tick, 250);
        return () => clearInterval(interval);
    }, [end]);
    const time = `${Math.floor(remaining / 60)
        .toString()
        .padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`;
    return (
        <Card variant="ghost" className="rounded-2xl bg-[#ebebeb] py-7">
            <CardContent className="px-6">
                <div className="mb-6 flex items-center justify-between">
                    <span className="text-[11px] font-semibold">ONE THING AT A TIME</span>
                    <Sprout size={22} className="text-primary" strokeWidth={1.3} />
                </div>
                <h2 className="text-xl leading-snug font-semibold">Make room for deep work.</h2>
                <p className="mt-3 text-sm leading-relaxed">
                    A quiet{' '}
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={3}
                        aria-label="Focus session duration in minutes"
                        title="Changing the duration resets the timer"
                        value={minutes}
                        disabled={end !== null}
                        style={{ width: `${Math.max(1, minutes.length)}ch` }}
                        className="text-primary focus-visible:border-primary min-w-0 rounded-none border-0 border-b border-dotted border-neutral-400 bg-transparent p-0 text-center leading-[inherit] outline-none focus-visible:border-solid disabled:opacity-60"
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
                    />{' '}
                    {durationMinutes === 1 ? 'minute' : 'minutes'} to move your most important task
                    forward.
                </p>
                {started && (
                    <div
                        role="timer"
                        aria-label="Focus time remaining"
                        className="my-5 text-center text-4xl font-medium tabular-nums"
                    >
                        {time}
                    </div>
                )}
                {!remaining && (
                    <p role="status" className="my-3 text-sm">
                        A little progress. Take a breath—you earned it.
                    </p>
                )}
                <Button
                    className="mt-6 h-10 w-full gap-2 rounded-lg"
                    onClick={() => {
                        if (end !== null) {
                            setRemaining(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
                            setEnd(null);
                        } else {
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
                          : 'Start a focus session'}
                </Button>
                {started && (
                    <Button
                        variant="ghost"
                        className="mt-2 w-full gap-2 text-xs text-neutral-500"
                        onClick={() => {
                            setEnd(null);
                            setRemaining(durationMinutes * 60);
                            setStarted(false);
                        }}
                    >
                        <RotateCcw size={13} />
                        Reset timer
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
