import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    ArrowLeft,
    ArrowRight,
    KeyRound,
    Mail,
    Pencil,
    Power,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    UsersRound,
} from 'lucide-react';
import type { PanelUser } from '../../types';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { AccentTitle } from '@/components/accent-title';
import useUserStore from '@/store/use-user-store';
import CreatePanelUser from '../create';
import EditPanelUser from '../edit';
import ResetPanelUserPassword from '../reset-password';
import { panelUserRoleLabel } from '../panel-user-role-label';
import { activatePanelUser } from '../../api/activate-user';
import { disablePanelUser } from '../../api/disable-user';
import { deletePanelUser } from '../../api/panel-users';
import useInvalidateUsers from '../use-invalidate-users';
import DisplayError from '@/components/display-error';
import { InlineConfirm } from '@/components/inline-confirm';
import { sendResetLink } from '@/app/admin/api';
import { cn } from '@/lib/utils';
import { formatTimestamp } from '@/lib/date';

type Action = 'edit' | 'reset';
const pageSize = 10;

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
    const invalidate = useInvalidateUsers();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<{ user: PanelUser; action: Action } | null>(null);
    const action = useMutation({
        mutationFn: async ({
            id,
            type,
        }: {
            id: string;
            type: 'delete' | 'activate' | 'disable';
        }) => {
            if (type === 'delete') await deletePanelUser(id);
            else if (type === 'activate') await activatePanelUser(id);
            else await disablePanelUser(id);
        },
        onSuccess: async (_, { type }) => {
            const messages = {
                delete: {
                    title: 'User deleted',
                    description: 'The user account has been removed.',
                },
                activate: { title: 'User activated', description: 'The user can now sign in.' },
                disable: { title: 'User disabled', description: 'The user can no longer sign in.' },
            };
            toast.add({ type: type === 'delete' ? 'warning' : 'info', ...messages[type] });
            await invalidate();
        },
    });
    const email = useMutation({
        mutationFn: sendResetLink,
        onSuccess: (data) =>
            toast.add({ type: 'info', title: 'Reset link accepted', description: data.detail }),
    });
    const busy = action.isPending || email.isPending;
    const filtered = users.filter(
        (user) =>
            (statusFilter === 'all' || user.is_active === (statusFilter === 'active')) &&
            (roleFilter === 'all' || user.role === roleFilter) &&
            `${user.username} ${user.display_name} ${user.email} ${user.role}`
                .toLowerCase()
                .includes(search.trim().toLowerCase())
    );
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, pages);
    const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const active = users.filter((user) => user.is_active).length;

    return (
        <>
            <section
                aria-label="People management"
                className="bg-card border-input flex min-h-96 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border"
            >
                <header className="border-input flex flex-wrap items-center justify-between gap-5 border-b px-5 py-6 sm:px-6">
                    <div className="flex items-center gap-3.5">
                        <span className="bg-primary/12 text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl">
                            <UsersRound size={21} strokeWidth={1.5} />
                        </span>
                        <div>
                            <h1 className="text-foreground text-xl font-semibold tracking-tight">
                                <AccentTitle>Your people, in good hands</AccentTitle>
                            </h1>
                            <p className="text-muted-foreground mt-1.5 text-xs">
                                A thoughtful place to manage accounts and access.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="text-muted-foreground flex items-center gap-3 text-[11px]">
                            <span>
                                <strong className="text-foreground font-medium tabular-nums">
                                    {users.length}
                                </strong>{' '}
                                people
                            </span>
                            <span className="bg-border h-3 w-px" />
                            <span className="flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                {active} active
                            </span>
                        </div>
                        <CreatePanelUser />
                    </div>
                </header>
                <div className="border-input flex flex-wrap items-center gap-3 border-b px-5 py-4 sm:px-6">
                    <div className="relative min-w-48 flex-1">
                        <Search
                            size={15}
                            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
                        />
                        <Input
                            type="search"
                            placeholder="Find a name, username, or email…"
                            aria-label="Search people"
                            className="h-10 w-full rounded-xl pl-10 text-xs"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <select
                        aria-label="Filter account status"
                        className="flow-control border-input bg-card text-foreground h-10 rounded-xl border px-3 text-xs outline-none"
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="all">All statuses</option>
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                    </select>
                    <select
                        aria-label="Filter account role"
                        className="flow-control border-input bg-card text-foreground h-10 rounded-xl border px-3 text-xs outline-none"
                        value={roleFilter}
                        onChange={(event) => {
                            setRoleFilter(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="all">All roles</option>
                        <option value="user">User</option>
                        {currentUser?.role === 'superuser' && (
                            <>
                                <option value="staff">Administrator</option>
                                <option value="superuser">System administrator</option>
                            </>
                        )}
                    </select>
                    <Button
                        variant="outline"
                        disabled={isRefetching}
                        aria-busy={isRefetching}
                        className="h-10 w-28 shrink-0 gap-2 rounded-xl text-xs"
                        onClick={onRefetch}
                    >
                        <RefreshCw
                            size={14}
                            className={cn(
                                'shrink-0',
                                isRefetching && 'animate-spin motion-reduce:animate-none'
                            )}
                        />
                        Refresh
                    </Button>
                </div>
                <DisplayError error={action.variables?.type === 'activate' ? action.error : null} />
                <DisplayError error={email.error} />
                <div className="min-h-0 w-full flex-1 overflow-x-auto">
                    <table className="w-full min-w-[1000px] border-collapse text-left text-xs">
                        <thead className="bg-accent/40 text-muted-foreground">
                            <tr className="border-input border-b">
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-[10px] font-medium tracking-wider uppercase"
                                >
                                    Person
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-[10px] font-medium tracking-wider uppercase"
                                >
                                    Access
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-[10px] font-medium tracking-wider uppercase"
                                >
                                    Level
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-[10px] font-medium tracking-wider uppercase"
                                >
                                    Last sign-in
                                </th>
                                <th
                                    scope="col"
                                    className="w-[28rem] px-6 py-3 text-right text-[10px] font-medium tracking-wider uppercase"
                                >
                                    Account actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-border divide-y">
                            {visible.map((user) => {
                                const self = user.id === currentUser?.id;
                                const name = user.display_name || user.username;
                                const initials = name
                                    .split(/\s+/)
                                    .slice(0, 2)
                                    .map((part) => part[0])
                                    .join('')
                                    .toUpperCase();
                                return (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-accent/25 focus-within:bg-accent/25 transition-colors"
                                    >
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={cn(
                                                        'flex size-10 shrink-0 items-center justify-center rounded-2xl text-xs font-medium',
                                                        user.role === 'superuser'
                                                            ? 'bg-secondary/10 text-secondary'
                                                            : 'bg-primary/15 text-primary-foreground'
                                                    )}
                                                >
                                                    {initials}
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-foreground font-medium">
                                                            {name}
                                                        </span>
                                                        {self && (
                                                            <span className="border-input text-muted-foreground rounded-md border px-1.5 py-0.5 text-[9px]">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-muted-foreground mt-1 text-[10px]">
                                                        @{user.username}
                                                    </p>
                                                    <p className="text-muted-foreground mt-1 max-w-60 truncate text-[10px]">
                                                        {user.email || 'No email added'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 align-middle">
                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] whitespace-nowrap',
                                                    user.role === 'superuser'
                                                        ? 'bg-secondary/10 text-secondary'
                                                        : user.role === 'staff'
                                                          ? 'bg-primary/15 text-primary-foreground'
                                                          : 'bg-accent text-muted-foreground'
                                                )}
                                            >
                                                {user.role !== 'user' && <ShieldCheck size={12} />}
                                                {panelUserRoleLabel[user.role]}
                                            </span>
                                            <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-[10px]">
                                                <span
                                                    className={cn(
                                                        'size-1.5 rounded-full',
                                                        user.is_active
                                                            ? 'bg-emerald-500'
                                                            : 'bg-destructive'
                                                    )}
                                                />
                                                {user.is_active ? 'Active' : 'Disabled'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 align-middle">
                                            <span className="bg-primary/15 text-primary-foreground inline-flex rounded-lg px-2.5 py-1 text-[11px] font-semibold tabular-nums">
                                                LVL {user.level}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 align-middle whitespace-nowrap">
                                            {user.last_login ? (
                                                <time dateTime={user.last_login}>
                                                    <span className="text-foreground block text-[11px]">
                                                        {formatTimestamp(user.last_login, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                    <span className="text-muted-foreground mt-1 block text-[10px]">
                                                        {formatTimestamp(user.last_login, {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </time>
                                            ) : (
                                                <span className="text-muted-foreground text-[11px]">
                                                    Not signed in yet
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    className="text-muted-foreground size-8 shrink-0 rounded-lg p-0"
                                                    aria-label={`Edit ${user.username}`}
                                                    disabled={busy}
                                                    onClick={() =>
                                                        setSelected({ user, action: 'edit' })
                                                    }
                                                >
                                                    <Pencil size={14} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="text-muted-foreground size-8 shrink-0 rounded-lg p-0"
                                                    aria-label={`Set a new password for ${user.username}`}
                                                    disabled={self || busy}
                                                    onClick={() =>
                                                        setSelected({ user, action: 'reset' })
                                                    }
                                                >
                                                    <KeyRound size={14} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="text-muted-foreground size-8 shrink-0 rounded-lg p-0"
                                                    aria-label={`Email a reset link to ${user.username}`}
                                                    disabled={
                                                        self ||
                                                        !user.is_active ||
                                                        !user.email ||
                                                        busy
                                                    }
                                                    onClick={() => email.mutate(user.id)}
                                                >
                                                    <Mail size={14} />
                                                </Button>
                                                {user.is_active ? (
                                                    <InlineConfirm
                                                        label={`Disable ${user.username}`}
                                                        title="Disable access?"
                                                        description={`${user.username} will no longer be able to sign in. You can reactivate the account later.`}
                                                        confirmLabel="Disable account"
                                                        disabled={self || busy}
                                                        onConfirm={() =>
                                                            action.mutateAsync({
                                                                id: user.id,
                                                                type: 'disable',
                                                            })
                                                        }
                                                    >
                                                        <Power size={13} />
                                                        Disable
                                                    </InlineConfirm>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        className="text-primary-foreground h-9 w-40 justify-end gap-2 rounded-xl text-xs"
                                                        disabled={self || busy}
                                                        onClick={() =>
                                                            action.mutate({
                                                                id: user.id,
                                                                type: 'activate',
                                                            })
                                                        }
                                                    >
                                                        <Power size={13} />
                                                        Activate
                                                    </Button>
                                                )}
                                                <InlineConfirm
                                                    label={`Delete ${user.username}`}
                                                    title="Delete account?"
                                                    description={`${user.username} will be permanently removed. This cannot be undone.`}
                                                    confirmLabel="Delete account"
                                                    disabled={self || busy}
                                                    onConfirm={() =>
                                                        action.mutateAsync({
                                                            id: user.id,
                                                            type: 'delete',
                                                        })
                                                    }
                                                >
                                                    <Trash2 size={13} />
                                                    Delete
                                                </InlineConfirm>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!visible.length && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <UsersRound
                                            size={26}
                                            strokeWidth={1.4}
                                            className="text-muted-foreground mx-auto mb-4"
                                        />
                                        <p className="text-foreground text-sm font-medium">
                                            No people found
                                        </p>
                                        <p className="text-muted-foreground mt-2 text-xs">
                                            Try another name or adjust your filters.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <footer className="border-input flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 sm:px-6">
                    <p className="text-muted-foreground text-[11px]">
                        Showing{' '}
                        <span className="text-foreground tabular-nums">
                            {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–
                            {Math.min(currentPage * pageSize, filtered.length)}
                        </span>{' '}
                        of {filtered.length} people
                    </p>
                    <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-[11px] tabular-nums">
                            Page {currentPage} of {pages}
                        </span>
                        <Button
                            variant="outline"
                            className="size-8 rounded-lg p-0"
                            aria-label="Previous people page"
                            disabled={currentPage === 1}
                            onClick={() => setPage(currentPage - 1)}
                        >
                            <ArrowLeft size={14} />
                        </Button>
                        <Button
                            variant="outline"
                            className="size-8 rounded-lg p-0"
                            aria-label="Next people page"
                            disabled={currentPage === pages}
                            onClick={() => setPage(currentPage + 1)}
                        >
                            <ArrowRight size={14} />
                        </Button>
                    </div>
                </footer>
            </section>
            {selected?.action === 'edit' && (
                <EditPanelUser user={selected.user} onClose={() => setSelected(null)} />
            )}
            {selected?.action === 'reset' && (
                <ResetPanelUserPassword user={selected.user} onClose={() => setSelected(null)} />
            )}
        </>
    );
}
