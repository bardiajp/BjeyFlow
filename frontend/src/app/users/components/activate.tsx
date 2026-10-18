import ConfirmDialog from '@/components/confirm-dialog';
import { activatePanelUser } from '../api/activate-user';
import type { PanelUser } from '../types';
import useInvalidateUsers from './use-invalidate-users';

export default function ActivatePanelUser({
    user,
    onClose,
}: {
    user: PanelUser;
    onClose: () => void;
}) {
    const invalidate = useInvalidateUsers();
    return (
        <ConfirmDialog
            title="Activate user"
            description={`Allow ${user.username} to sign in again?`}
            action={() => activatePanelUser(user.id)}
            onSuccess={invalidate}
            onClose={onClose}
        />
    );
}
