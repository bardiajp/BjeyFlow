import { Menu } from '@base-ui/react/menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, ChevronDown, LogOut, SlidersHorizontal, Waves } from 'lucide-react';
import { Link } from 'react-router';
import { logout } from '@/app/users/api/logout';
import DisplayError from '@/components/display-error';
import { toast } from '@/components/ui/toast';
import useUserStore from '@/store/use-user-store';
import { cn } from '@/lib/utils';

export function AccountMenu({
    name,
    initials,
    onNavigate,
    collapsed = false,
}: {
    name: string;
    initials: string;
    onNavigate?: () => void;
    collapsed?: boolean;
}) {
    const queryClient = useQueryClient();
    const clearUser = useUserStore((state) => state.clearUser);
    const user = useUserStore((state) => state.user);
    const mutation = useMutation({
        mutationFn: logout,
        onSuccess: () => {
            toast.add({
                type: 'success',
                title: 'Signed out',
                description: 'You have signed out of your account.',
            });
            queryClient.clear();
            clearUser();
        },
    });
    return (
        <div className="border-t border-slate-200/80 pt-3">
            <Menu.Root modal={false}>
                <Menu.Trigger
                    aria-label={`Account menu for ${name}`}
                    title={collapsed ? name : undefined}
                    className={cn(
                        'group focus-visible:ring-primary border-input bg-card/65 relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border py-2.5 text-left shadow-[0_2px_8px_-5px_#02304725] transition-[padding,border-color,box-shadow] duration-700 ease-in-out outline-none hover:border-(--control-hover-border) hover:shadow-sm focus-visible:ring-2 motion-reduce:transition-none',
                        collapsed ? 'px-[7px]' : 'px-2.5'
                    )}
                >
                    <span className="bg-brand text-primary flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt=""
                                className="size-full rounded-xl object-cover"
                            />
                        ) : (
                            initials
                        )}
                    </span>
                    <span className="sidebar-copy min-w-0 flex-1 pr-4 whitespace-nowrap">
                        <span className="text-primary-foreground block truncate text-xs font-semibold">
                            {name}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-slate-400">
                            {user?.flow_name || 'Your personal space'}
                        </span>
                    </span>
                    <ChevronDown
                        size={15}
                        className={cn(
                            'sidebar-copy absolute right-2.5 text-slate-400 transition-[rotate,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-popup-open:rotate-180 motion-reduce:transition-none'
                        )}
                    />
                </Menu.Trigger>
                <Menu.Portal>
                    <Menu.Positioner side="top" align="start" sideOffset={8} className="z-50">
                        <Menu.Popup className="bg-popover text-popover-foreground border-input w-(--anchor-width) max-w-[calc(100vw-2rem)] min-w-64 overflow-hidden rounded-[22px] border shadow-xl transition-[clip-path,translate] duration-500 ease-in-out outline-none [clip-path:inset(0_0_0_0_round_22px)] data-ending-style:translate-y-4 data-ending-style:[clip-path:inset(100%_0_0_0_round_22px)] data-starting-style:translate-y-4 data-starting-style:[clip-path:inset(100%_0_0_0_round_22px)] motion-reduce:transition-none">
                            <div className="surface-wash border-input border-b p-4">
                                <span className="text-muted-foreground mb-3 flex items-center gap-1.5 text-[8px] font-semibold tracking-[0.14em]">
                                    <Waves size={12} />
                                    YOUR PERSONAL SPACE
                                </span>
                                <p className="text-foreground truncate text-[13px] font-semibold">
                                    {name}
                                </p>
                                <p className="text-muted-foreground mt-1 text-[10px]">
                                    A little more flow, your way.
                                </p>
                            </div>
                            <div className="grid gap-1 p-2">
                                <Menu.Item
                                    render={<Link to="/settings" />}
                                    onClick={onNavigate}
                                    className="data-highlighted:bg-accent data-highlighted:border-input flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-xs outline-none"
                                >
                                    <span className="border-input bg-background flex size-8 shrink-0 items-center justify-center rounded-lg border">
                                        <SlidersHorizontal size={15} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block font-medium">
                                            Account & settings
                                        </span>
                                        <span className="text-muted-foreground mt-1 block text-[9px]">
                                            Profile, appearance & your rhythm
                                        </span>
                                    </span>
                                    <ArrowUpRight size={13} className="text-muted-foreground" />
                                </Menu.Item>
                                <Menu.Item
                                    disabled={mutation.isPending}
                                    onClick={() => mutation.mutate()}
                                    className="text-secondary data-highlighted:bg-secondary/10 border-input mt-1 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-xs outline-none data-disabled:opacity-50"
                                >
                                    <LogOut size={16} />
                                    {mutation.isPending ? 'Signing out…' : 'Sign out'}
                                </Menu.Item>
                            </div>
                        </Menu.Popup>
                    </Menu.Positioner>
                </Menu.Portal>
            </Menu.Root>
            <DisplayError error={mutation.error} />
        </div>
    );
}
