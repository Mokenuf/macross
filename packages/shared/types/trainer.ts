import { z } from 'zod'

import { roleEnum } from './enums'
import { queryParamsSchema } from './query-params'

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
})

export const createTrainerSchema = z.object({
  fullName: z.string().min(1, 'El nombre es requerido'),
  email: z.email('El email no es valido'),
  phone: z.string().optional(),
})

export const updateTrainerSchema = createTrainerSchema.omit({ email: true }).extend({
  avatarUrl: z.preprocess(val => (val === '' ? undefined : val), z.url().optional()),
})

export const trainerSortSchema = z.enum(['fullName', 'createdAt'])
export const trainerQueryParamsSchema = queryParamsSchema.extend({
  sort: trainerSortSchema.default('createdAt'),
  role: roleEnum.optional(),
})

export type Trainer = z.infer<typeof trainerSchema>
export type CreateTrainer = z.infer<typeof createTrainerSchema>
export type UpdateTrainer = z.infer<typeof updateTrainerSchema>
export type TrainerSortOptions = z.infer<typeof trainerSortSchema>
export type TrainerQueryParams = z.infer<typeof trainerQueryParamsSchema>
