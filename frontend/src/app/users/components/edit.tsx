import type { PanelUser } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import UserForm from './form';

export default function EditPanelUser({ user, onClose }: { user: PanelUser; onClose: () => void }) {
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent>
                <DialogTitle>Edit user</DialogTitle>
                <DialogDescription>Update {user.username}’s profile and role.</DialogDescription>
                <UserForm user={user} onClose={onClose} />
            </DialogContent>
        </Dialog>
    );
}
