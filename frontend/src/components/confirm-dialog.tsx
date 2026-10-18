import { useMutation } from '@tanstack/react-query';
import DisplayError from './display-error';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from './ui/dialog';

export default function ConfirmDialog({
    title,
    description,
    action,
    onSuccess,
    onClose,
    destructive = false,
}: {
    title: string;
    description: string;
    action: () => Promise<unknown>;
    onSuccess: () => Promise<unknown>;
    onClose: () => void;
    destructive?: boolean;
}) {
    const mutation = useMutation({
        mutationFn: action,
        onSuccess: async () => {
            await onSuccess();
            onClose();
        },
    });
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !mutation.isPending) onClose();
            }}
        >
            <DialogContent>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
                <DisplayError error={mutation.error} />
                <DialogFooter>
                    <Button variant="cancel" onClick={onClose} disabled={mutation.isPending}>
                        Cancel
                    </Button>
                    <Button
                        variant={destructive ? 'destructive' : 'default'}
                        isPending={mutation.isPending}
                        onClick={() => mutation.mutate()}
                    >
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
