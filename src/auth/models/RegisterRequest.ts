import { z } from 'zod';
import { registerSchema } from '../utils/validation';

export type RegisterRequest = z.infer<typeof registerSchema>;
