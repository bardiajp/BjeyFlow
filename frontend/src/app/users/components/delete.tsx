import ConfirmDialog from '@/components/confirm-dialog';
import { deletePanelUser } from '../api/panel-users';
import type { PanelUser } from '../types';
import useInvalidateUsers from './use-invalidate-users';

export default function DeletePanelUser({
    user,
    onClose,
}: {
    user: PanelUser;
    onClose: () => void;
}) {
    const invalidate = useInvalidateUsers();
    return (
        <ConfirmDialog
            title="Delete user"
            description={`Permanently delete ${user.username}? This cannot be undone.`}
            action={() => deletePanelUser(user.id)}
            onSuccess={invalidate}
            onClose={onClose}
            destructive
        />
    );
}
