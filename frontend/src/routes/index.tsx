import { Navigate, Route, Routes } from 'react-router';
import Login from '@/app/users/login';
import UsersPage from '@/app/users/page';
import Loading from '@/components/loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/layouts';
import useUserStore from '@/store/use-user-store';

export default function AppRoutes() {
    const user = useUserStore((state) => state.user);
    if (user === undefined) return <Loading />;
    return (
        <Routes>
            {user ? (
                <Route element={<Layout />}>
                    <Route
                        index
                        element={
                            user.role === 'superuser' ? (
                                <Navigate to="/settings/users" replace />
                            ) : (
                                <Card className="w-full">
                                    <CardHeader>
                                        <CardTitle>Welcome to BjeyFlow</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        You are signed in. User management is available to system
                                        administrators.
                                    </CardContent>
                                </Card>
                            )
                        }
                    />
                    <Route
                        path="settings/users"
                        element={
                            user.role === 'superuser' ? <UsersPage /> : <Navigate to="/" replace />
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            ) : (
                <>
                    <Route path="login" element={<Login />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </>
            )}
        </Routes>
    );
}
