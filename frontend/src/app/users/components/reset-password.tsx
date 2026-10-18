import type { PanelUser } from '../types';
import { resetPanelUserPassword } from '../api/panel-users';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import PasswordForm from './password-form';

export default function ResetPanelUserPassword({
    user,
    onClose,
}: {
    user: PanelUser;
    onClose: () => void;
}) {
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent>
                <DialogTitle>Reset password</DialogTitle>
                <DialogDescription>Set a new password for {user.username}.</DialogDescription>
                <PasswordForm
                    action={(values) => resetPanelUserPassword(user.id, values.new_password)}
                    onClose={onClose}
                />
            </DialogContent>
        </Dialog>
    );
}
