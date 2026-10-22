import { z } from 'zod';

const HealthIndicatorResultSchema = z.record(
    z.string(),
    z.object({
        status: z.enum(['up', 'down', 'degraded']).meta({
            description: '该依赖的健康状态',
            examples: ['up'],
        }),
    })
);

export const HealthResponseSchema = z.looseObject({
    status: z.enum(['error', 'ok', 'degraded', 'shutting_down']).meta({
        description: '整体健康状态',
        examples: ['ok'],
    }),
    info: HealthIndicatorResultSchema.optional().meta({
        description: '状态为 up 或 degraded 的依赖明细',
        examples: [{ prisma: { status: 'up' }, redis: { status: 'up' } }],
    }),
    error: HealthIndicatorResultSchema.optional().meta({
        description: '状态为 down 的依赖明细，全部正常时为空对象',
        examples: [{}],
    }),
    details: HealthIndicatorResultSchema.optional().meta({
        description: '全部依赖的合并明细',
        examples: [
            {
                prisma: { status: 'up' },
                redis: { status: 'up' },
            },
        ],
    }),
});
