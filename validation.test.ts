import { describe, it, expect } from 'vitest';
import { EmailSchema } from './validation';

describe('EmailSchema', () => {
    it('should validate correct email data', () => {
        const data = { to: 'test@example.com', subject: 'Hello' };
        expect(EmailSchema.safeParse(data).success).toBe(true);
    });

    it('should fail on incorrect email', () => {
        const data = { to: 'invalid-email', subject: 'Hello' };
        expect(EmailSchema.safeParse(data).success).toBe(false);
    });
});
