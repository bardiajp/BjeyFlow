import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { axiosInstance } from '@/lib/api';
import useUserStore from '@/store/use-user-store';
import { Button } from '@/components/ui/button';
import { LabeledInput } from '@/components/form/labeled';
import DisplayError from '@/components/display-error';
import { FormActions } from '@/components/form-actions';

export function DeleteAccount() {
    const [password, setPassword] = useState('');
    const [confirming, setConfirming] = useState(false);
    const clearUser = useUserStore((state) => state.clearUser);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const reduceMotion = useReducedMotion();
    const deletion = useMutation({
        mutationFn: () => axiosInstance.delete('users/auth/me/', { data: { password } }),
        onSuccess: () => {
            queryClient.clear();
            clearUser();
            void navigate('/login', { replace: true });
        },
    });

    return (
        <section className="min-w-0">
            <div className="flex min-w-0 items-start gap-3">
                <span className="bg-destructive/10 text-destructive flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <Trash2 size={17} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="text-foreground text-sm font-semibold">Delete account</h2>
                    <p className="text-muted-foreground mt-1.5 text-[11px] leading-relaxed">
                        Permanently remove your account, projects and tasks. This cannot be undone.
                        Security audit records may be retained.
                    </p>
                </div>
            </div>
            <AnimatePresence initial={false}>
                {!confirming ? (
                    <motion.div key="trigger" exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.12 }}>
                        <Button
                            type="button"
                            variant="destructive"
                            className="mt-4 w-full gap-2 border-red-600 bg-red-600/10 text-xs text-red-600 hover:bg-red-600/20 dark:text-red-400 [&_svg]:text-red-600 dark:[&_svg]:text-red-400"
                            onClick={() => setConfirming(true)}
                        >
                            <Trash2 size={14} aria-hidden="true" />
                            Delete account
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="confirmation"
                        initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2 }}
                        className="min-w-0 overflow-hidden"
                    >
                        <form
                            className="border-destructive/20 bg-destructive/5 mt-4 grid min-w-0 gap-4 rounded-2xl border p-4"
                            onSubmit={(event) => { event.preventDefault(); deletion.mutate(); }}
                        >
                            <div className="text-foreground flex items-start gap-2 text-xs leading-relaxed">
                                <AlertTriangle size={15} className="text-destructive mt-0.5 shrink-0" aria-hidden="true" />
                                <p>Confirm with your password. The last system administrator must transfer their role first.</p>
                            </div>
                            <LabeledInput
                                label="Confirm your password"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                disabled={deletion.isPending}
                                required
                            />
                            <DisplayError error={deletion.error} />
                            <FormActions className="grid grid-cols-2 sm:flex">
                                <Button
                                    type="button"
                                    variant="cancel"
                                    disabled={deletion.isPending}
                                    onClick={() => { setConfirming(false); setPassword(''); deletion.reset(); }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    className="border-red-600 bg-red-600/10 text-red-600 hover:bg-red-600/20 dark:text-red-400"
                                    isPending={deletion.isPending}
                                >
                                    Delete account
                                </Button>
                            </FormActions>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
