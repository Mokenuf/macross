import { z } from 'zod'

export const clientSchema = z.object({
  id: z.string().uuid(),
  trainerId: z.string().uuid(),
  fullName: z.string(),
  email: z.email(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  nanoId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

export type Client = z.infer<typeof clientSchema>
