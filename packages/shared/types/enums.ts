import { z } from 'zod'

export const roleEnum = z.enum(['manager', 'trainer'])

export type Role = z.infer<typeof roleEnum>
