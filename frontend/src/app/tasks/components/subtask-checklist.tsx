import { Plus, Trash2 } from 'lucide-react';
import { useId } from 'react';
import { SortableList } from '@/components/sortable';
import DisplayError from '@/components/display-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ChecklistItem {
    id: string;
    title: string;
    is_completed: boolean;
}

export function SubtaskChecklist<T extends ChecklistItem>({
    items,
    title,
    onTitleChange,
    onAdd,
    onToggle,
    onDelete,
    onReorder,
    disabled = false,
    adding = false,
    deletingId,
    error,
}: {
    items: T[];
    title: string;
    onTitleChange: (value: string) => void;
    onAdd: () => void;
    onToggle: (id: string, completed: boolean) => void;
    onDelete: (id: string) => void;
    onReorder: (items: T[], move: { from: number; to: number }) => void;
    disabled?: boolean;
    adding?: boolean;
    deletingId?: string;
    error?: unknown;
}) {
    const prefix = useId();
    const completed = items.filter((item) => item.is_completed).length;
    return (
        <section className="grid gap-3 border-t border-neutral-200 pt-5" aria-label="Subtasks">
            <div className="flex justify-between text-sm font-medium">
                <span>Subtasks</span>
                <span className="text-neutral-500">
                    {completed} / {items.length}
                </span>
            </div>
            <Progress value={completed} max={items.length} label="Checklist progress" />
            <SortableList
                items={items}
                label={(item) => `Reorder subtask: ${item.title}`}
                disabled={disabled}
                onReorder={onReorder}
            >
                {(item, handle) => (
                    <div className="flex items-center gap-2 text-sm">
                        {handle}
                        <Checkbox
                            id={`${prefix}-${item.id}`}
                            aria-label={`${item.is_completed ? 'Reopen' : 'Complete'} subtask: ${item.title}`}
                            checked={item.is_completed}
                            disabled={disabled}
                            onCheckedChange={(checked) => onToggle(item.id, checked)}
                        />
                        <label
                            htmlFor={`${prefix}-${item.id}`}
                            className={cn(
                                'min-w-0 flex-1 cursor-pointer break-words',
                                item.is_completed && 'text-muted-foreground line-through'
                            )}
                        >
                            {item.title}
                        </label>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon-sm"
                            className="shrink-0"
                            aria-label={`Delete subtask: ${item.title}`}
                            disabled={disabled}
                            isPending={deletingId === item.id}
                            onClick={() => onDelete(item.id)}
                        >
                            <Trash2 size={15} />
                        </Button>
                    </div>
                )}
            </SortableList>
            {!items.length && (
                <p className="text-sm text-neutral-400">Break this task into smaller steps.</p>
            )}
            <div className="flex gap-2">
                <Input
                    aria-label="New subtask"
                    placeholder="Add a small step…"
                    maxLength={255}
                    className="h-9 text-sm"
                    value={title}
                    onChange={(event) => onTitleChange(event.target.value)}
                    disabled={disabled}
                    onKeyDown={(event) => {
                        if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
                        event.preventDefault();
                        event.stopPropagation();
                        if (title.trim() && !disabled) onAdd();
                    }}
                />
                <Button
                    type="button"
                    variant="outline"
                    disabled={!title.trim() || disabled}
                    isPending={adding}
                    aria-label="Add subtask"
                    onClick={onAdd}
                >
                    <Plus size={16} />
                </Button>
            </div>
            <DisplayError error={typeof error === 'string' ? new Error(error) : error} />
        </section>
    );
}
