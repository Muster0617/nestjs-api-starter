import { registerAs } from '@nestjs/config';

export default registerAs('doc', () => ({
    path: '/docs',
}));
