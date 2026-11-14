import {
    closestCorners,
    defaultDropAnimationSideEffects,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
    type KeyboardCoordinateGetter,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import { useState, type ReactNode } from 'react';
import { CircleCheck, CircleDashed, GripVertical, MoveRight, Timer } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { reorderBoard } from '../api/reorder';
import { useInvalidateTasks } from '../hooks/use-invalidate-tasks';
import type { Task, TaskStatus } from '../types';
import { TaskRow } from './task-row';
import { SortableItem } from '@/components/sortable';
import DisplayError from '@/components/display-error';
import { cn } from '@/lib/utils';

const columns: { status: TaskStatus; title: string }[] = [
    { status: 'todo', title: 'To do' },
    { status: 'in_progress', title: 'In progress' },
    { status: 'completed', title: 'Completed' },
];

const columnStyles = {
    todo: {
        icon: CircleDashed,
        tone: 'bg-primary/20 text-primary-foreground',
        surface: 'bg-primary/5',
        caption: 'A fresh place to start',
    },
    in_progress: {
        icon: Timer,
        tone: 'bg-orange-100 text-orange-600',
        surface: 'bg-orange-50/50',
        caption: 'One thing at a time',
    },
    completed: {
        icon: CircleCheck,
        tone: 'bg-emerald-100 text-emerald-700',
        surface: 'bg-emerald-50/50',
        caption: 'Small wins, real progress',
    },
};

function BoardColumn({
    status,
    title,
    count,
    children,
}: {
    status: TaskStatus;
    title: string;
    count: number;
    children: ReactNode;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: `column:${status}` });
    const { icon: Icon, tone, surface, caption } = columnStyles[status];
    return (
        <section
            ref={setNodeRef}
            aria-label={`${title} column`}
            className={cn(
                'min-h-72 min-w-0 rounded-[20px] border border-slate-200/60 p-3 transition-[background-color,border-color,box-shadow] duration-300 motion-reduce:transition-none',
                surface,
                isOver && 'border-primary bg-primary/15 ring-primary/25 ring-2'
            )}
        >
            <div className="mb-4 flex items-center gap-2.5 px-1 pt-1">
                <span
                    className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-xl',
                        tone
                    )}
                >
                    <Icon size={18} strokeWidth={1.7} />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="text-primary-foreground text-[13px] font-semibold">{title}</h2>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">{caption}</p>
                </div>
                <span className="flex min-w-6 items-center justify-center rounded-lg border border-white bg-white/70 px-1.5 py-1 text-[11px] font-semibold text-slate-500 tabular-nums">
                    {count}
                </span>
            </div>
            {children}
        </section>
    );
}

export function TaskBoard({
    tasks,
    today,
    onOpen,
}: {
    tasks: Task[];
    today: string;
    onOpen: (id: string) => void;
}) {
    const invalidate = useInvalidateTasks();
    const reduceMotion = useReducedMotion();
    const [draft, setDraft] = useState<Task[] | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [landedId, setLandedId] = useState<string | null>(null);
    const items = draft ?? tasks;
    const keyboardCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
        if (!event.code.startsWith('Arrow') || !context.active || !context.collisionRect) return;
        event.preventDefault();
        const activeTask = items.find((task) => task.id === context.active?.id);
        const overTask = items.find((task) => task.id === context.over?.id);
        const status =
            columns.find((column) => `column:${column.status}` === context.over?.id)?.status ??
            overTask?.status ??
            activeTask?.status;
        if (!status) return;
        let targetId: string | undefined;
        if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
            const index = columns.findIndex((column) => column.status === status);
            const next = columns[index + (event.code === 'ArrowRight' ? 1 : -1)];
            if (!next) return;
            targetId =
                items.find((task) => task.status === next.status)?.id ?? `column:${next.status}`;
        } else {
            const columnItems = items.filter((task) => task.status === status);
            const index = columnItems.findIndex(
                (task) => task.id === (overTask?.id ?? activeTask?.id)
            );
            targetId = columnItems[index + (event.code === 'ArrowDown' ? 1 : -1)]?.id;
        }
        const rect = targetId ? context.droppableRects.get(targetId) : undefined;
        if (rect)
            return {
                x: rect.left + (rect.width - context.collisionRect.width) / 2,
                y: rect.top + (rect.height - context.collisionRect.height) / 2,
            };
    };
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates, scrollBehavior: 'auto' })
    );
    const mutation = useMutation({
        mutationFn: (next: Task[]) =>
            reorderBoard(next.map(({ id, status, position }) => ({ id, status, position }))),
        onSuccess: async () => {
            toast.add({
                type: 'info',
                title: 'Board updated',
                description: 'Task positions and statuses have been saved.',
            });
            await invalidate();
            setDraft(null);
        },
        onError: () => {
            setDraft(null);
            void invalidate();
        },
    });
    const onDragEnd = ({ active, over }: DragEndEvent) => {
        setActiveId(null);
        if (!over || active.id === over.id || mutation.isPending) return;
        const moved = items.find((task) => task.id === active.id);
        const target = items.find((task) => task.id === over.id);
        const status =
            target?.status ??
            columns.find((column) => `column:${column.status}` === over.id)?.status;
        if (!moved || !status) return;
        const grouped = Object.fromEntries(
            columns.map((column) => [
                column.status,
                items.filter((task) => task.status === column.status),
            ])
        ) as Record<TaskStatus, Task[]>;
        const source = grouped[moved.status];
        const from = source.findIndex((task) => task.id === moved.id);
        if (moved.status === status) {
            const to = target
                ? source.findIndex((task) => task.id === target.id)
                : source.length - 1;
            if (from === to) return;
            grouped[status] = arrayMove(source, from, to);
        } else {
            grouped[moved.status] = source.filter((task) => task.id !== moved.id);
            const destination = grouped[status];
            const to = target
                ? destination.findIndex((task) => task.id === target.id)
                : destination.length;
            destination.splice(to, 0, { ...moved, status });
        }
        const next = columns.flatMap((column) =>
            grouped[column.status].map((task, position) => ({ ...task, position }))
        );
        setDraft(next);
        if (moved.status !== status && !reduceMotion) setLandedId(moved.id);
        mutation.mutate(next);
    };
    const active = items.find((task) => task.id === activeId);
    return (
        <div className="grid gap-5">
            <DisplayError error={mutation.error} />
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="bg-primary size-1.5 rounded-full" />
                    <span>
                        <span className="text-primary-foreground font-semibold tabular-nums">
                            {items.length}
                        </span>{' '}
                        tasks ·{' '}
                        <span className="text-primary-foreground font-semibold tabular-nums">
                            {items.filter((task) => task.status === 'completed').length}
                        </span>{' '}
                        completed
                    </span>
                </div>
                <p
                    className="flex items-center gap-1.5 text-[10px] text-slate-400"
                    title="Keyboard: Space to pick up, arrow keys to move, Space to drop."
                >
                    <GripVertical size={13} />
                    Drag to find your flow
                    <MoveRight size={13} />
                </p>
            </div>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={({ active }) => {
                    setLandedId(null);
                    setActiveId(String(active.id));
                }}
                onDragCancel={() => setActiveId(null)}
                onDragEnd={onDragEnd}
            >
                <div className="grid items-start gap-4 md:grid-cols-3">
                    {columns.map((column) => {
                        const columnItems = items.filter((task) => task.status === column.status);
                        return (
                            <BoardColumn key={column.status} {...column} count={columnItems.length}>
                                <SortableContext
                                    items={columnItems.map((task) => task.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="grid gap-3">
                                        {columnItems.map((task) => (
                                            <SortableItem
                                                key={task.id}
                                                id={task.id}
                                                label={`Move task: ${task.title}`}
                                                disabled={mutation.isPending}
                                                dragWholeItem
                                            >
                                                {() => (
                                                    <div className="relative isolate">
                                                        {landedId === task.id && (
                                                            <div
                                                                aria-hidden="true"
                                                                className="pointer-events-none absolute inset-0 -z-10"
                                                            >
                                                                <span className="board-water-ripple" />
                                                                <span
                                                                    className="board-water-ripple board-water-ripple-delayed"
                                                                    onAnimationEnd={() =>
                                                                        setLandedId(null)
                                                                    }
                                                                />
                                                            </div>
                                                        )}
                                                        <TaskRow
                                                            task={task}
                                                            today={today}
                                                            onOpen={onOpen}
                                                            board
                                                            disabled={mutation.isPending}
                                                        />
                                                    </div>
                                                )}
                                            </SortableItem>
                                        ))}
                                        {!columnItems.length && (
                                            <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300/70 bg-white/40 p-4 text-center">
                                                <MoveRight
                                                    size={21}
                                                    strokeWidth={1.3}
                                                    className="text-slate-300"
                                                />
                                                <p className="text-xs font-medium text-slate-500">
                                                    A little room to move.
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    Drop a task here.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </SortableContext>
                            </BoardColumn>
                        );
                    })}
                </div>
                <DragOverlay
                    dropAnimation={
                        reduceMotion
                            ? null
                            : {
                                  duration: 550,
                                  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                                  sideEffects: defaultDropAnimationSideEffects({
                                      styles: { active: { opacity: '0' } },
                                  }),
                              }
                    }
                >
                    {active && (
                        <div className="ring-primary/15 pointer-events-none rounded-2xl shadow-[0_16px_40px_-12px_#02304750] ring-4">
                            <TaskRow task={active} today={today} onOpen={onOpen} board disabled />
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
