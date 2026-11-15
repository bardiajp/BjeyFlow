import { Navigate, Route, Routes } from 'react-router';
import TasksPage from '@/app/tasks/page';
import TrashPage from '@/app/tasks/trash';
import SettingsPage from '@/app/settings/page';
import Login from '@/app/users/login';
import UsersPage from '@/app/users/page';
import NotFound from '@/app/not-found';
import AdminLayout from '@/app/admin/layout';
import AdminOverview from '@/app/admin/overview';
import AdminServices from '@/app/admin/services';
import AdminEvents from '@/app/admin/events';
import AdminSettings from '@/app/admin/settings';
import AdminEmailTemplates from '@/app/admin/email-templates';
import AppLoading from '@/components/app-loading';
import Layout from '@/layouts';
import useUserStore from '@/store/use-user-store';

export default function AppRoutes() {
    const user = useUserStore((state) => state.user);
    if (user === undefined) return <AppLoading />;
    return (
        <Routes>
            <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
                <Route index element={<Navigate to="/today" replace />} />
                <Route path="inbox" element={<TasksPage key="inbox" view="inbox" />} />
                <Route path="today" element={<TasksPage key="today" view="today" />} />
                <Route path="upcoming" element={<TasksPage key="upcoming" view="upcoming" />} />
                <Route path="completed" element={<TasksPage key="completed" view="completed" />} />
                <Route path="trash" element={<TrashPage />} />
                <Route path="projects/:projectId" element={<TasksPage view="project" />} />
                <Route
                    path="admin"
                    element={
                        user && user.role !== 'user' ? (
                            <AdminLayout />
                        ) : (
                            <Navigate to="/today" replace />
                        )
                    }
                >
                    <Route index element={<AdminOverview />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route
                        path="activity"
                        element={<AdminEvents key="activity" kind="activity" />}
                    />
                    <Route path="services" element={<AdminServices />} />
                    <Route path="emails" element={<AdminEvents key="emails" kind="emails" />} />
                    <Route path="email-templates" element={<AdminEmailTemplates />} />
                    <Route path="errors" element={<AdminEvents key="errors" kind="errors" />} />
                    <Route path="settings" element={<AdminSettings />} />
                </Route>
                <Route path="settings">
                    <Route index element={<SettingsPage />} />
                    <Route
                        path="users"
                        element={
                            user && user.role !== 'user' ? (
                                <Navigate to="/admin/users" replace />
                            ) : (
                                <Navigate to="/settings" replace />
                            )
                        }
                    />
                </Route>
            </Route>
            <Route path="login" element={user ? <Navigate to="/today" replace /> : <Login />} />
            <Route path="forgot-password" element={<Login recovery="request" />} />
            <Route path="reset-password" element={<Login recovery="confirm" />} />
            <Route
                path="signup"
                element={user ? <Navigate to="/today" replace /> : <Login signup />}
            />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
