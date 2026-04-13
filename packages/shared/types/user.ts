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

export const clientUserSchema = z.object({
  fullName: z.string(),
  email: z.email(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  nanoId: z.string(),
})

export type AdminUser = z.infer<typeof adminUserSchema>
export type ClientUser = z.infer<typeof clientUserSchema>
