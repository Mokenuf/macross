import { z } from 'zod'

import { clientGoalEnum, clientLevelEnum } from './enums'
import { queryParamsSchema, type BaseFilters } from './query-params'

export const clientSchema = z.object({
  id: z.string().uuid(),
  trainerId: z.string().uuid(),
  fullName: z.string(),
  email: z.email(),
  phone: z.string().nullable(),
  avatarUrl: z.url().nullable(),
  trainer: z.object({ id: z.uuid(), fullName: z.string(), nanoId: z.string() }).optional(),
  nanoId: z.string(),
  birthDate: z.string().nullable(),
  weightKg: z.number().nullable(),
  heightCm: z.number().int().nullable(),
  level: clientLevelEnum.nullable(),
  goal: z.array(clientGoalEnum).nullable(),
  desiredWeeklyFrequency: z.number().int().nullable(),
  injuries: z.string().nullable(),
  availableEquipment: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

export const createClientSchema = z.object({
  fullName: z.string().min(1, 'El nombre es requerido'),
  email: z.email('El email no es valido'),
  phone: z.string().optional(),
  trainerId: z.uuid().optional(),
  // Datos de entrenamiento: cargables ya en el invite (Seba los toma en la venta)
  birthDate: z.string().optional(),
  weightKg: z.coerce.number().positive().optional(),
  heightCm: z.coerce.number().int().positive().optional(),
  level: z.preprocess(val => (val === '' ? undefined : val), clientLevelEnum.optional()),
  goal: z.array(clientGoalEnum).optional(),
  desiredWeeklyFrequency: z.coerce.number().int().min(1).max(7).optional(),
  injuries: z.string().optional(),
  availableEquipment: z.string().optional(),
})

export const updateClientSchema = createClientSchema.omit({ email: true }).extend({
  avatarUrl: z.preprocess(val => (val === '' ? undefined : val), z.url().optional()),
  notes: z.string().optional(),
})

export const clientSortSchema = z.enum(['fullName', 'createdAt'])
export const clientQueryParamsSchema = queryParamsSchema.extend({
  sort: clientSortSchema.default('createdAt'),
  trainerId: z.preprocess(val => (val === '' ? undefined : val), z.uuid().optional()),
})

export type Client = z.infer<typeof clientSchema>
export type CreateClient = z.infer<typeof createClientSchema>
export type UpdateClient = z.infer<typeof updateClientSchema>
export type ClientSortOptions = z.infer<typeof clientSortSchema>
export type ClientQueryParams = z.infer<typeof clientQueryParamsSchema>

export type ClientFilters = BaseFilters & {
  trainerId: string | ''
  sort: ClientSortOptions
}
