import {
    closestCorners,
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
import { useState, type ReactNode } from 'react';
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
    return (
        <section
            ref={setNodeRef}
            aria-label={`${title} column`}
            className={cn(
                'min-h-44 min-w-0 rounded-xl border border-transparent bg-neutral-50 p-3 transition-colors',
                isOver && 'border-primary bg-primary/10'
            )}
        >
            <h2 className="mb-4 flex justify-between text-sm font-semibold">
                {title}
                <span className="text-muted-foreground font-normal">{count}</span>
            </h2>
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
    const [draft, setDraft] = useState<Task[] | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
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
        mutation.mutate(next);
    };
    const active = items.find((task) => task.id === activeId);
    return (
        <div className="grid gap-4">
            <DisplayError error={mutation.error} />
            <p className="text-muted-foreground text-xs">
                Drag the handles to reorder cards or move them between columns. Keyboard: Space,
                arrow keys, Space.
            </p>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={({ active }) => setActiveId(String(active.id))}
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
                                            >
                                                {(handle) => (
                                                    <TaskRow
                                                        task={task}
                                                        today={today}
                                                        onOpen={onOpen}
                                                        board
                                                        disabled={mutation.isPending}
                                                        dragHandle={handle}
                                                    />
                                                )}
                                            </SortableItem>
                                        ))}
                                        {!columnItems.length && (
                                            <p className="text-muted-foreground px-1 py-6 text-xs">
                                                Drop a task here.
                                            </p>
                                        )}
                                    </div>
                                </SortableContext>
                            </BoardColumn>
                        );
                    })}
                </div>
                <DragOverlay>
                    {active && (
                        <div className="border-primary rounded-xl border bg-white p-4 text-sm font-medium shadow-xl">
                            {active.title}
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
