import { Link, Outlet } from 'react-router';
import Logout from '@/app/users/components/logout';
import ChangePassword from '@/app/users/components/change-password';
import useUserStore from '@/store/use-user-store';

export default function Layout() {
    const user = useUserStore((state) => state.user);
    return (
        <div className="bg-muted/20 min-h-dvh">
            <header className="bg-background flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
                <nav className="flex items-center gap-6">
                    <Link to="/" className="text-lg font-semibold">
                        BjeyFlow
                    </Link>
                    {user?.role === 'superuser' && (
                        <Link to="/settings/users" className="text-sm">
                            Users
                        </Link>
                    )}
                </nav>
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-muted-foreground text-sm">
                        {user?.display_name || user?.username}
                    </span>
                    <ChangePassword />
                    <Logout />
                </div>
            </header>
            <main className="mx-auto flex max-w-7xl p-6">
                <Outlet />
            </main>
        </div>
    );
}
