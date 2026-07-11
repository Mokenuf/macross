import { z } from 'zod'

import { roleEnum, type Role } from './enums'
import { queryParamsSchema, type BaseFilters } from './query-params'

export const trainerSchema = z.object({
  id: z.uuid(),
  fullName: z.string(),
  email: z.email(),
  role: roleEnum,
  avatarUrl: z.url().nullable(),
  phone: z.string().nullable(),
  nanoId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  activeClients: z.number().optional(),
  totalClients: z.number().optional(),
})

export const createTrainerSchema = z.object({
  fullName: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
})

export const updateTrainerSchema = createTrainerSchema.omit({ email: true }).extend({
  avatarUrl: z.preprocess(val => (val === '' ? undefined : val), z.url().optional()),
})

export const trainerSortSchema = z.enum(['fullName', 'createdAt'])
export const trainerQueryParamsSchema = queryParamsSchema.extend({
  sort: trainerSortSchema.default('createdAt'),
  role: z.preprocess(val => (val === '' ? undefined : val), roleEnum.optional()),
})

export type Trainer = z.infer<typeof trainerSchema>
export type CreateTrainer = z.infer<typeof createTrainerSchema>
export type UpdateTrainer = z.infer<typeof updateTrainerSchema>
export type TrainerSortOptions = z.infer<typeof trainerSortSchema>
export type TrainerQueryParams = z.infer<typeof trainerQueryParamsSchema>

export type TrainerFilters = BaseFilters & {
  role: Role | ''
  sort: TrainerSortOptions
}
