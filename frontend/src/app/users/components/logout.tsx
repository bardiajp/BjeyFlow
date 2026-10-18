import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '../api/logout';
import { Button } from '@/components/ui/button';
import DisplayError from '@/components/display-error';
import useUserStore from '@/store/use-user-store';

export default function Logout() {
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
        <div>
            <Button
                variant="ghost"
                isPending={mutation.isPending}
                onClick={() => mutation.mutate()}
            >
                Sign out
            </Button>
            <DisplayError error={mutation.error} />
        </div>
    );
}
