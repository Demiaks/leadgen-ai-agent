import { z } from 'zod';

export const PublishLandingSchema = z.object({
    html: z.string().min(1),
    slug: z.string().optional(),
    deploymentConfig: z.object({
        type: z.enum(['SFTP', 'FTP', 'WEBHOOK', 'NONE']),
        host: z.string().optional(),
        port: z.number().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
        path: z.string().optional(),
        secure: z.boolean().optional(),
        webhookUrl: z.string().optional(),
        webhookSecret: z.string().optional(),
    }).optional(),
});

export const EmailSchema = z.object({
    to: z.string().email(),
    subject: z.string().min(1),
    text: z.string().optional(),
    html: z.string().optional(),
});
