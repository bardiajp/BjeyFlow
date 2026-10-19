import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

export function HelpDialog({ onClose }: { onClose: () => void }) {
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent>
                <DialogTitle>A little help along the way.</DialogTitle>
                <DialogDescription>Keep the next step simple.</DialogDescription>
                <dl className="grid gap-4 py-3 text-sm">
                    <div className="flex justify-between">
                        <dt>Search tasks</dt>
                        <dd>
                            <kbd className="rounded bg-neutral-100 px-2 py-1 text-xs">
                                ⌘ / Ctrl K
                            </kbd>
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt>Create a task</dt>
                        <dd>
                            <kbd className="rounded bg-neutral-100 px-2 py-1 text-xs">N</kbd>
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt>Open this help</dt>
                        <dd>
                            <kbd className="rounded bg-neutral-100 px-2 py-1 text-xs">?</kbd>
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt>Close a dialog</dt>
                        <dd>
                            <kbd className="rounded bg-neutral-100 px-2 py-1 text-xs">Esc</kbd>
                        </dd>
                    </div>
                </dl>
                <p className="text-sm leading-relaxed text-neutral-500">
                    Every task belongs to a project. Inbox contains all your tasks. Today shows
                    tasks due today; Upcoming shows the next seven days. Click a task to edit it or
                    work through its subtasks.
                </p>
            </DialogContent>
        </Dialog>
    );
}
