import { useQuery } from '@tanstack/react-query';
import AsyncState from '@/components/async-state';
import { Skeleton } from '@/components/ui/skeleton';
import { listUsers } from './api/list-users';
import UsersList from './components/list/list';

export default function UsersPage() {
    const query = useQuery({ queryKey: ['users'], queryFn: listUsers });
    return (
        <div className="flex min-h-0 w-full flex-1 flex-col">
            <AsyncState
                isLoading={query.isPending}
                error={query.data ? null : query.error}
                loadingComponent={<Skeleton className="min-h-96 w-full flex-1 rounded-3xl" />}
                component={
                    <UsersList
                        users={query.data ?? []}
                        isRefetching={query.isRefetching}
                        onRefetch={async () => { await query.refetch({ throwOnError: true }); }}
                    />
                }
            />
        </div>
    );
}
