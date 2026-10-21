import { Menu } from '@base-ui/react/menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, CircleHelp, LogOut, SlidersHorizontal, UserRound } from 'lucide-react';
import { Link } from 'react-router';
import { logout } from '@/app/users/api/logout';
import DisplayError from '@/components/display-error';
import useUserStore from '@/store/use-user-store';

export function AccountMenu({
    name,
    initials,
    onNavigate,
    onHelp,
}: {
    name: string;
    initials: string;
    onNavigate?: () => void;
    onHelp: () => void;
}) {
    const queryClient = useQueryClient();
    const clearUser = useUserStore((state) => state.clearUser);
    const mutation = useMutation({
        mutationFn: logout,
        onSuccess: () => {
            queryClient.clear();
            clearUser();
        },
    });
    return (
        <div className="border-t border-neutral-200 pt-6">
            <Menu.Root>
                <Menu.Trigger
                    aria-label={`Account menu for ${name}`}
                    className="group focus-visible:ring-primary flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left outline-none hover:bg-neutral-50 focus-visible:ring-2"
                >
                    <span className="text-secondary flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm">
                        {initials}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
                    <ChevronDown
                        size={15}
                        className="transition-transform duration-300 group-data-popup-open:rotate-180 motion-reduce:transition-none"
                    />
                </Menu.Trigger>
                <Menu.Portal>
                    <Menu.Positioner side="top" align="start" sideOffset={8} className="z-50">
                        <Menu.Popup className="bg-popover text-popover-foreground ring-foreground/10 w-(--anchor-width) min-w-48 rounded-xl p-1.5 shadow-lg ring-1 transition-[transform,opacity] duration-300 ease-out outline-none data-ending-style:translate-y-3 data-ending-style:opacity-0 data-starting-style:translate-y-3 data-starting-style:opacity-0 motion-reduce:transition-none">
                            <Menu.Item
                                render={<Link to="/settings" />}
                                onClick={onNavigate}
                                className="data-highlighted:bg-accent flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none"
                            >
                                <UserRound size={16} />
                                Account details
                            </Menu.Item>
                            <Menu.Item
                                render={<Link to="/settings" />}
                                onClick={onNavigate}
                                className="data-highlighted:bg-accent flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none"
                            >
                                <SlidersHorizontal size={16} />
                                Settings
                            </Menu.Item>
                            <Menu.Item
                                onClick={onHelp}
                                className="data-highlighted:bg-accent flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none"
                            >
                                <CircleHelp size={16} />
                                Help & shortcuts
                            </Menu.Item>
                            <Menu.Item
                                disabled={mutation.isPending}
                                onClick={() => mutation.mutate()}
                                className="text-secondary border-secondary bg-secondary/10 data-highlighted:bg-secondary/20 mt-1.5 flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm outline-none data-disabled:opacity-50"
                            >
                                <LogOut size={16} />
                                {mutation.isPending ? 'Signing out…' : 'Sign out'}
                            </Menu.Item>
                        </Menu.Popup>
                    </Menu.Positioner>
                </Menu.Portal>
            </Menu.Root>
            <DisplayError error={mutation.error} />
        </div>
    );
}
