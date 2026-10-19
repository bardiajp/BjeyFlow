import { z } from 'zod';

export const loginSchema = z.object({
    username: z.string().trim().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    remember_me: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const userSchema = z.object({
    username: z.string().min(1, 'Username is required').max(150),
    display_name: z.string().max(150),
    first_name: z.string().max(150),
    last_name: z.string().max(150),
    mobile: z.string().max(32),
    role: z.enum(['user', 'staff', 'superuser']),
});

export const createUserSchema = userSchema.extend({
    password: z.string().min(8, 'Use at least 8 characters'),
});

export const changePasswordSchema = z.object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'Use at least 8 characters'),
});

export const resetPasswordSchema = changePasswordSchema.pick({ new_password: true });
