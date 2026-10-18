import { useQueryClient } from '@tanstack/react-query';

export default function useInvalidateUsers() {
    const client = useQueryClient();
    return () => client.invalidateQueries({ queryKey: ['users'] });
}
