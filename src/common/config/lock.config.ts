import { registerAs } from '@nestjs/config';

export default registerAs('lock', () => ({
    defaultTtl: 30000,
    maxTtl: 300000,
    keyPrefix: '_lock:',
    retry: {
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 3000,
        multiplier: 2,
    },
    autoRenew: {
        enabled: true,
        intervalFraction: 0.5,
    },
}));
