import { z } from 'zod';
import { loginSchema } from '../utils/validation';

export type LoginRequest = z.infer<typeof loginSchema>;
