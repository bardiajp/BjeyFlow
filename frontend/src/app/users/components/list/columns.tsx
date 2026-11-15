import type { ReactNode } from 'react';
import type { PanelUser } from '../../types';
import { Badge } from '@/components/ui/badge';
import { panelUserRoleLabel } from '../panel-user-role-label';
import { formatTimestamp } from '@/lib/date';

export const userColumns: { id: string; label: string; render: (user: PanelUser) => ReactNode }[] =
    [
        { id: 'username', label: 'Username', render: (user) => user.username },
        { id: 'display_name', label: 'Name', render: (user) => user.display_name || '—' },
        { id: 'email', label: 'Email', render: (user) => user.email || '—' },
        {
            id: 'last_login',
            label: 'Last sign-in',
            render: (user) =>
                user.last_login ? formatTimestamp(user.last_login) : 'Not signed in yet',
        },
        { id: 'role', label: 'Role', render: (user) => panelUserRoleLabel[user.role] },
        {
            id: 'is_active',
            label: 'Status',
            render: (user) => (
                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                    {user.is_active ? 'Active' : 'Disabled'}
                </Badge>
            ),
        },
    ];
