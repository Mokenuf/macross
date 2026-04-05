import { z } from 'zod'

import { roleEnum } from './enums'

export const adminUserSchema = z.object({
  fullName: z.string(),
  email: z.email(),
  role: roleEnum,
  avatarUrl: z.string().nullable(),
  phone: z.string().nullable(),
  nanoId: z.string(),
})

export type AdminUser = z.infer<typeof adminUserSchema>
