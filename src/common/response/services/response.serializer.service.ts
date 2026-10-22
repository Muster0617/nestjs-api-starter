import { Injectable } from '@nestjs/common';
import { type StandardSchemaV1 } from '@standard-schema/spec';

@Injectable()
export class ResponseSerializerService {
    async serialize(
        data: unknown,
        schema: StandardSchemaV1 | undefined,
        paginated = false,
        handler = 'unknown handler'
    ): Promise<unknown> {
        if (!schema) return data;

        if (paginated) {
            const { items, metadata } = (data ?? {}) as {
                items?: unknown[];
                metadata: unknown;
            };

            return {
                items: await Promise.all(
                    (items ?? []).map((item, index) =>
                        this.validateOne(schema, item, `${handler}[${index}]`)
                    )
                ),
                metadata,
            };
        }

        return this.validateOne(schema, data, handler);
    }

    private async validateOne(
        schema: StandardSchemaV1,
        value: unknown,
        handler: string
    ): Promise<unknown> {
        const result = await schema['~standard'].validate(value);
        if (result.issues) {
            throw new Error(
                `Serialization failed at ${handler}: ${result.issues
                    .map(issue => issue.message)
                    .join(', ')}`
            );
        }
        return result.value;
    }
}
