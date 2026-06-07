import { z } from 'zod'

export const orderEnum = z.enum(['asc', 'desc'])

export const roleEnum = z.enum(['manager', 'trainer'])
export const Roles = roleEnum.enum

export type OrderOptions = z.infer<typeof orderEnum>
export type Role = z.infer<typeof roleEnum>
