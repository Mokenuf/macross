import { z } from 'zod'

export const orderEnum = z.enum(['asc', 'desc'])

export const roleEnum = z.enum(['manager', 'trainer'])
export const Roles = roleEnum.enum

export const clientLevelEnum = z.enum(['beginner', 'intermediate', 'advanced', 'athlete'])
export const ClientLevels = clientLevelEnum.enum

export const clientGoalEnum = z.enum(['hypertrophy', 'strength', 'fat_loss', 'health'])
export const ClientGoals = clientGoalEnum.enum

export type OrderOptions = z.infer<typeof orderEnum>
export type Role = z.infer<typeof roleEnum>
export type ClientLevel = z.infer<typeof clientLevelEnum>
export type ClientGoal = z.infer<typeof clientGoalEnum>
