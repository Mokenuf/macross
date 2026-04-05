import { z } from 'zod'

import { roleEnum } from './enums'

export const trainerSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.email(),
  role: roleEnum,
  avatarUrl: z.string().nullable(),
  phone: z.string().nullable(),
  nanoId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

export type Trainer = z.infer<typeof trainerSchema>
