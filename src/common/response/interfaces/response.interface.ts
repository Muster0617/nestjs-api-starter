import { type StandardSchemaV1 } from '@standard-schema/spec';

interface IPaginationMetadata {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
}

interface IApiBaseResponse {
    statusCode: number;
    message: string;
    timestamp: string;
}

export interface IApiPaginatedData<T> {
    items: T[];
    metadata: IPaginationMetadata;
}

export interface IApiErrorResponse extends IApiBaseResponse {
    error?: string | string[] | Record<string, unknown>;
}

export interface IResolvedException {
    statusCode: number;
    message: string;
    validationMessages?: string[];
    prismaCode?: string;
}

export type PrismaErrorResponse = Record<
    string,
    { statusCode: number; message: string }
>;

export interface IResponseMetadataOptions {
    message?: string;
    serialization?: StandardSchemaV1;
    paginated?: boolean;
}
