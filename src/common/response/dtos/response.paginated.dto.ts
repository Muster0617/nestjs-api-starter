import { z } from 'zod';

export const ApiPaginationMetadataSchema = z.object({
    currentPage: z.number().meta({ description: '当前页码', examples: [1] }),
    itemsPerPage: z
        .number()
        .meta({ description: '每页条目数', examples: [10] }),
    totalItems: z.number().meta({ description: '总条目数', examples: [100] }),
    totalPages: z.number().meta({ description: '总页数', examples: [10] }),
});
