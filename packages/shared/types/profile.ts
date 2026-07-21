import { z } from 'zod'

import { clientGoalEnum, clientLevelEnum } from './enums'

export const profileSchema = z.object({
  id: z.uuid(),
  fullName: z.string(),
  email: z.email(),
  avatarUrl: z.url().nullable(),
  trainer: z.object({ id: z.uuid(), fullName: z.string() }).nullable(),
  birthDate: z.string().nullable(),
  weightKg: z.number().nullable(),
  heightCm: z.number().int().nullable(),
  level: clientLevelEnum.nullable(),
  goal: z.array(clientGoalEnum).nullable(),
  desiredWeeklyFrequency: z.number().int().nullable(),
})

export type Profile = z.infer<typeof profileSchema>
