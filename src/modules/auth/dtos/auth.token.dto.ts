import { z } from 'zod';

export const AuthTokenSchema = z.object({
    accessToken: z.string().meta({
        description: '访问令牌（JWT）',
        examples: [
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vIn0.signature',
        ],
    }),
    refreshToken: z.string().meta({
        description: '刷新令牌（JWT）',
        examples: [
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vIn0.signature',
        ],
    }),
});

export type AuthTokenDto = z.infer<typeof AuthTokenSchema>;
