import { useQuery } from '@tanstack/react-query';
import AsyncState from '@/components/async-state';
import { Skeleton } from '@/components/ui/skeleton';
import PageLayout from '@/layouts/page';
import { listUsers } from './api/list-users';
import UsersList from './components/list/list';

export default function UsersPage() {
    const query = useQuery({ queryKey: ['users'], queryFn: listUsers });
    return (
        <PageLayout title="User management">
            <AsyncState
                isLoading={query.isPending}
                error={query.error}
                loadingComponent={<Skeleton className="h-80 w-full" />}
                component={
                    <UsersList
                        users={query.data ?? []}
                        isRefetching={query.isRefetching}
                        onRefetch={() => void query.refetch()}
                    />
                }
            />
        </PageLayout>
    );
}
