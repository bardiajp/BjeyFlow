import { z } from 'zod';

export const projectSchema = z.object({
    name: z.string().trim().min(1, 'Give your project a name.').max(150),
    description: z.string().trim(),
    color: z
        .string()
        .trim()
        .regex(/^#?[0-9a-fA-F]{6}$/, 'Enter a six-digit hex color, such as #8ECAE6.')
        .transform((value) => `#${value.replace(/^#/, '').toUpperCase()}`),
    icon: z.enum([
        'hash',
        'folder',
        'briefcase',
        'code',
        'book',
        'heart',
        'star',
        'target',
        'palette',
        'coffee',
        'music',
        'rocket',
    ]),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
