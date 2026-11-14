import { useQueryClient } from '@tanstack/react-query';

export function useInvalidateTasks() {
    const client = useQueryClient();
    return () =>
        Promise.all([
            client.invalidateQueries({ queryKey: ['tasks'] }),
            client.invalidateQueries({ queryKey: ['projects'] }),
        ]);
}
