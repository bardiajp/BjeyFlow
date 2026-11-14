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

export const signupIdentitySchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, 'Use at least 3 characters')
        .max(150)
        .regex(/^[\p{L}\p{N}_@.+-]+$/u, 'Use letters, numbers, or @ . + - _'),
    email: z.string().trim().email('Enter a valid email address').max(254),
    first_name: z.string().trim().min(1, 'Your first name is required').max(150),
    last_name: z.string().trim().min(1, 'Your last name is required').max(150),
    password: z.string().min(8, 'Use at least 8 characters').max(128),
});

export const signupSchema = signupIdentitySchema.extend({
    flow_name: z.string().trim().max(60),
    focus_style: z.enum(['morning_tide', 'night_current', 'steady_tide']),
    north_star: z.string().trim().max(200),
    workspace_name: z.string().trim().min(1, 'Give your first project a name').max(150),
});

export type SignupFormValues = z.infer<typeof signupSchema>;
