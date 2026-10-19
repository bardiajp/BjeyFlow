import { Navigate, Route, Routes } from 'react-router';
import TasksPage from '@/app/tasks/page';
import SettingsPage from '@/app/settings/page';
import Login from '@/app/users/login';
import UsersPage from '@/app/users/page';
import Loading from '@/components/loading';
import Layout from '@/layouts';
import useUserStore from '@/store/use-user-store';

export default function AppRoutes() {
    const user = useUserStore((state) => state.user);
    if (user === undefined) return <Loading />;
    return (
        <Routes>
            {user ? (
                <Route path="" element={<Layout />}>
                    <Route index element={<Navigate to="/today" replace />} />
                    <Route path="inbox" element={<TasksPage key="inbox" view="inbox" />} />
                    <Route path="today" element={<TasksPage key="today" view="today" />} />
                    <Route path="upcoming" element={<TasksPage key="upcoming" view="upcoming" />} />
                    <Route
                        path="completed"
                        element={<TasksPage key="completed" view="completed" />}
                    />
                    <Route path="projects">
                        <Route path=":projectId" element={<TasksPage view="project" />} />
                    </Route>
                    <Route path="settings">
                        <Route index element={<SettingsPage />} />
                        <Route
                            path="users"
                            element={
                                user.role === 'superuser' ? (
                                    <UsersPage />
                                ) : (
                                    <Navigate to="/settings" replace />
                                )
                            }
                        />
                    </Route>
                    <Route path="*" element={<Navigate to="/today" replace />} />
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
