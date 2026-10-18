import ConfirmDialog from '@/components/confirm-dialog';
import { disablePanelUser } from '../api/disable-user';
import type { PanelUser } from '../types';
import useInvalidateUsers from './use-invalidate-users';

export default function DisablePanelUser({
    user,
    onClose,
}: {
    user: PanelUser;
    onClose: () => void;
}) {
    const invalidate = useInvalidateUsers();
    return (
        <ConfirmDialog
            title="Disable user"
            description={`Prevent ${user.username} from signing in?`}
            action={() => disablePanelUser(user.id)}
            onSuccess={invalidate}
            onClose={onClose}
            destructive
        />
    );
}
