import { Link } from 'react-router';
import ChangePassword from '@/app/users/components/change-password';
import Logout from '@/app/users/components/logout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageLayout from '@/layouts/page';
import useUserStore from '@/store/use-user-store';

export default function SettingsPage() {
    const user = useUserStore((state) => state.user);
    return (
        <PageLayout title="Settings">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Your account</CardTitle>
                    <CardDescription>A little space to manage your account.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <dl className="grid gap-4 text-sm">
                        <div>
                            <dt className="text-neutral-500">Name</dt>
                            <dd className="mt-1 font-medium">
                                {user?.display_name || user?.username}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-neutral-500">Username</dt>
                            <dd className="mt-1">{user?.username}</dd>
                        </div>
                    </dl>
                    <div className="flex flex-wrap items-center gap-3">
                        <ChangePassword />
                        <Logout />
                    </div>
                    {user?.role === 'superuser' && (
                        <Link className="text-sm underline underline-offset-4" to="/settings/users">
                            Manage panel users →
                        </Link>
                    )}
                </CardContent>
            </Card>
        </PageLayout>
    );
}
