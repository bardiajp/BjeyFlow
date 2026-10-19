import { z } from 'zod';

export const taskSchema = z
    .object({
        title: z.string().trim().min(1, 'What would you like to do?').max(255),
        project: z.uuid('Choose a project.'),
        description: z.string().trim(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']),
        status: z.enum(['todo', 'in_progress', 'completed']),
        due_date: z.union([z.iso.date(), z.literal('')]),
        due_time: z.union([
            z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Choose a valid time.'),
            z.literal(''),
        ]),
        subtasks: z.array(
            z.object({ title: z.string().trim().min(1, 'Give this subtask a title.').max(255) })
        ),
    })
    .superRefine((values, context) => {
        if (values.due_time && !values.due_date) {
            context.addIssue({
                code: 'custom',
                path: ['due_date'],
                message: 'Choose a date before adding a time.',
            });
        }
    });

export type TaskFormValues = z.infer<typeof taskSchema>;
