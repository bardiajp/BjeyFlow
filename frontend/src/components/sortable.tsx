import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';

export function SortableItem({
    id,
    label,
    disabled,
    children,
}: {
    id: string;
    label: string;
    disabled?: boolean;
    children: (handle: ReactNode) => ReactNode;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled });
    const handle = (
        <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            disabled={disabled}
            aria-label={label}
            data-sortable-handle
            className="text-button-foreground focus-visible:outline-primary flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded focus-visible:outline-2 active:cursor-grabbing disabled:cursor-wait disabled:opacity-40"
            title="Drag to reorder, or press Space and use arrow keys"
        >
            <GripVertical size={16} />
        </button>
    );
    return (
        <div
            ref={setNodeRef}
            data-sortable-id={id}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.45 : 1,
                position: 'relative',
                zIndex: isDragging ? 1 : undefined,
            }}
        >
            {children(handle)}
        </div>
    );
}

export function SortableList<T extends { id: string }>({
    items,
    label,
    disabled,
    onReorder,
    children,
}: {
    items: T[];
    label: (item: T) => string;
    disabled?: boolean;
    onReorder: (items: T[]) => void;
    children: (item: T, handle: ReactNode) => ReactNode;
}) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
            scrollBehavior: 'auto',
        })
    );
    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id || disabled) return;
        const from = items.findIndex((item) => item.id === active.id);
        const to = items.findIndex((item) => item.id === over.id);
        if (from >= 0 && to >= 0) onReorder(arrayMove(items, from, to));
    };
    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
                items={items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="grid gap-3">
                    {items.map((item) => (
                        <SortableItem
                            key={item.id}
                            id={item.id}
                            label={label(item)}
                            disabled={disabled}
                        >
                            {(handle) => children(item, handle)}
                        </SortableItem>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
