import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, type ReactNode } from 'react';
import { me } from '@/app/users/api/get-status';
import DisplayError from '@/components/display-error';
import Loading from '@/components/loading';
import useUserStore from '@/store/use-user-store';

export default function AuthProvider({ children }: { children: ReactNode }) {
    const query = useQuery({ queryKey: ['status'], queryFn: me, staleTime: Infinity });
    const setUser = useUserStore((state) => state.setUser);
    const unauthorized = isAxiosError(query.error) && query.error.response?.status === 401;

    useEffect(() => {
        if (query.data) setUser(query.data.user);
        else if (unauthorized) setUser(null);
    }, [query.data, unauthorized, setUser]);

    if (query.isPending) return <Loading />;
    if (query.error && !unauthorized) {
        return <DisplayError error={query.error} onRetry={() => void query.refetch()} />;
    }
    return children;
}
