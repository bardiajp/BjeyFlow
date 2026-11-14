import { CalendarDays, Columns3, List } from 'lucide-react';
import { motion, useAnimationControls, useReducedMotion } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type TaskDisplayMode = 'list' | 'board' | 'calendar';

export function TaskViewTabs({
    value,
    onChange,
}: {
    value: TaskDisplayMode;
    onChange: (value: TaskDisplayMode) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLButtonElement>(null);
    const boardRef = useRef<HTMLButtonElement>(null);
    const calendarRef = useRef<HTMLButtonElement>(null);
    const controls = useAnimationControls();
    const reducedMotion = useReducedMotion();
    const [moving, setMoving] = useState(false);
    const [visualMode, setVisualMode] = useState(value);

    useLayoutEffect(() => {
        const container = containerRef.current!.getBoundingClientRect();
        const button = { list: listRef, board: boardRef, calendar: calendarRef }[
            value
        ].current!.getBoundingClientRect();
        controls.set({
            x: button.left - container.left,
            y: button.top - container.top,
            width: button.width,
            height: button.height,
        });
    }, [controls, value]);

    const change = async (next: TaskDisplayMode) => {
        if (next === value || moving) return;
        if (reducedMotion) {
            setVisualMode(next);
            onChange(next);
            return;
        }
        setMoving(true);
        const container = containerRef.current!.getBoundingClientRect();
        const position = (mode: TaskDisplayMode) => {
            const button = { list: listRef, board: boardRef, calendar: calendarRef }[
                mode
            ].current!.getBoundingClientRect();
            return {
                x: button.left - container.left,
                y: button.top - container.top,
                width: button.width,
                height: button.height,
            };
        };
        const slide = async (mode: TaskDisplayMode) => {
            setVisualMode(mode);
            await controls.start({
                ...position(mode),
                transition: { duration: 0.45, ease: 'easeInOut' },
            });
        };
        const jump = async (from: TaskDisplayMode, to: TaskDisplayMode) => {
            const start = position(from);
            const end = position(to);
            const size = 28;
            const startCenter = { x: start.x + start.width / 2, y: start.y + start.height / 2 };
            const endCenter = { x: end.x + end.width / 2, y: end.y + end.height / 2 };
            const peak = Math.min(startCenter.y, endCenter.y) - 62;
            await controls.start({
                x: startCenter.x - size / 2,
                y: startCenter.y - size / 2,
                width: size,
                height: size,
                borderRadius: '50px 50px 50px 5px',
                rotate: 135,
                backgroundColor: '#8ecae6',
                boxShadow: '0 4px 12px -3px #398aa860, inset 2px 2px 5px #ffffff90',
                transition: { duration: 0.2, ease: 'easeInOut' },
            });
            const curve = Array.from({ length: 41 }, (_, index) => {
                const t = index / 40;
                return {
                    x: startCenter.x + (endCenter.x - startCenter.x) * t - size / 2,
                    y:
                        (1 - t) ** 2 * startCenter.y +
                        2 * (1 - t) * t * peak +
                        t ** 2 * endCenter.y -
                        size / 2,
                };
            });
            await controls.start({
                x: curve.map((point) => point.x),
                y: curve.map((point) => point.y),
                rotate: [135, to === 'calendar' ? 155 : 115, 135],
                transition: { duration: 0.45, ease: 'linear' },
            });
            setVisualMode(to);
            await controls.start({
                ...end,
                borderRadius: '8px 8px 8px 8px',
                rotate: 0,
                backgroundColor: 'var(--card)',
                boxShadow: '0 2px 8px -3px #02304735, inset 0px 0px 0px #ffffff00',
                transition: { type: 'spring', stiffness: 420, damping: 27, mass: 0.6 },
            });
        };
        if (next === 'calendar') {
            if (value === 'list') await slide('board');
            await jump('board', 'calendar');
        } else if (value === 'calendar') {
            await jump('calendar', 'board');
            if (next === 'list') await slide('list');
        } else {
            await slide(next);
        }
        onChange(next);
        setMoving(false);
    };

    const buttonClass = (mode: TaskDisplayMode) =>
        cn(
            'relative z-20 flex h-9 w-[70px] items-center justify-center gap-1.5 rounded-lg text-[11px] font-medium text-slate-400 outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none',
            visualMode === mode && 'text-primary-foreground'
        );
    return (
        <div
            ref={containerRef}
            role="group"
            aria-label="Task display"
            aria-busy={moving}
            className="relative isolate flex shrink-0 items-center gap-3"
        >
            <motion.span
                aria-hidden="true"
                initial={{
                    x: 4,
                    y: 4,
                    width: 70,
                    height: 36,
                    borderRadius: '8px 8px 8px 8px',
                    rotate: 0,
                    backgroundColor: 'var(--card)',
                    boxShadow: '0 2px 8px -3px #02304735, inset 0px 0px 0px #ffffff00',
                }}
                animate={controls}
                className="pointer-events-none absolute top-0 left-0 z-10 rounded-lg border border-white bg-white shadow-[0_2px_8px_-3px_#02304735]"
            />
            <div className="flex rounded-xl bg-slate-100/80 p-1">
                <button
                    ref={listRef}
                    type="button"
                    aria-pressed={value === 'list'}
                    aria-disabled={moving}
                    onClick={() => void change('list')}
                    className={buttonClass('list')}
                >
                    <List size={16} strokeWidth={1.6} />
                    List
                </button>
                <button
                    ref={boardRef}
                    type="button"
                    aria-pressed={value === 'board'}
                    aria-disabled={moving}
                    onClick={() => void change('board')}
                    className={buttonClass('board')}
                >
                    <Columns3 size={16} strokeWidth={1.6} />
                    Board
                </button>
            </div>
            <div className="bg-primary/15 rounded-xl p-1">
                <button
                    ref={calendarRef}
                    type="button"
                    aria-label="Tide calendar view"
                    aria-pressed={value === 'calendar'}
                    title="Tide · Your calendar, in flow"
                    aria-disabled={moving}
                    onClick={() => void change('calendar')}
                    className={cn(buttonClass('calendar'), 'w-[84px]')}
                >
                    <CalendarDays size={16} strokeWidth={1.6} />
                    Tide
                </button>
            </div>
        </div>
    );
}
