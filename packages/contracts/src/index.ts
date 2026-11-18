import { z } from 'zod';

// Placeholder that proves the package wiring; replaced by the real schemas.
export const pingSchema = z.object({ message: z.string().min(1) });
export type Ping = z.infer<typeof pingSchema>;
