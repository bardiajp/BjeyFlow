import { useState } from 'react';
import type { PanelUser } from '../../types';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import useUserStore from '@/store/use-user-store';
import ActivatePanelUser from '../activate';
import CreatePanelUser from '../create';
import DeletePanelUser from '../delete';
import DisablePanelUser from '../disable';
import EditPanelUser from '../edit';
import ResetPanelUserPassword from '../reset-password';
import { userColumns } from './columns';

type Action = 'edit' | 'delete' | 'activate' | 'disable' | 'reset';

export default function UsersList({
    users,
    onRefetch,
    isRefetching,
}: {
    users: PanelUser[];
    onRefetch: () => void;
    isRefetching: boolean;
}) {
    const currentUser = useUserStore((state) => state.user);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<{ user: PanelUser; action: Action } | null>(null);
    const close = () => setSelected(null);
    const filtered = users.filter((user) =>
        `${user.username} ${user.display_name} ${user.role}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Panel users</CardTitle>
                    <CardDescription>Manage accounts, roles, and access.</CardDescription>
                    <CardAction>
                        <CreatePanelUser />
                    </CardAction>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="flex gap-3">
                        <Input
                            type="search"
                            placeholder="Search users…"
                            aria-label="Search users"
                            className="max-w-xs"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        <Button variant="outline" isPending={isRefetching} onClick={onRefetch}>
                            Refresh
                        </Button>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {userColumns.map((column) => (
                                    <TableHead key={column.id}>{column.label}</TableHead>
                                ))}
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((user) => {
                                const self = user.id === currentUser?.id;
                                return (
                                    <TableRow key={user.id}>
                                        {userColumns.map((column) => (
                                            <TableCell key={column.id}>
                                                {column.render(user)}
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setSelected({ user, action: 'edit' })
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={self}
                                                    onClick={() =>
                                                        setSelected({ user, action: 'reset' })
                                                    }
                                                >
                                                    Reset password
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={self}
                                                    onClick={() =>
                                                        setSelected({
                                                            user,
                                                            action: user.is_active
                                                                ? 'disable'
                                                                : 'activate',
                                                        })
                                                    }
                                                >
                                                    {user.is_active ? 'Disable' : 'Activate'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={self}
                                                    onClick={() =>
                                                        setSelected({ user, action: 'delete' })
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {!filtered.length && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-muted-foreground text-center"
                                    >
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {selected?.action === 'edit' && <EditPanelUser user={selected.user} onClose={close} />}
            {selected?.action === 'delete' && (
                <DeletePanelUser user={selected.user} onClose={close} />
            )}
            {selected?.action === 'activate' && (
                <ActivatePanelUser user={selected.user} onClose={close} />
            )}
            {selected?.action === 'disable' && (
                <DisablePanelUser user={selected.user} onClose={close} />
            )}
            {selected?.action === 'reset' && (
                <ResetPanelUserPassword user={selected.user} onClose={close} />
            )}
        </>
    );
}
