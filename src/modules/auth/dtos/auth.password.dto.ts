import { z } from 'zod';

import {
    PASSWORD_DESCRIPTION,
    PASSWORD_EXAMPLE,
    PASSWORD_PATTERN,
    PASSWORD_PATTERN_MESSAGE,
} from '../constants/auth.constant';

export const AuthPasswordSchema = z
    .string()
    .min(1)
    .regex(PASSWORD_PATTERN, PASSWORD_PATTERN_MESSAGE)
    .meta({
        description: PASSWORD_DESCRIPTION,
        examples: [PASSWORD_EXAMPLE],
    });
