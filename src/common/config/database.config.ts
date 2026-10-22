import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
    const url = process.env.DATABASE_URL?.trim();

    const schema = url
        ? URL.parse(url)?.searchParams.get('schema')?.trim()
        : undefined;

    return {
        url,
        schema: schema?.length ? schema : 'public',
    };
});
