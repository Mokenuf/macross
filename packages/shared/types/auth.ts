import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
})

export const setPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirm: z.string(),
  })
  .refine(data => data.password === data.confirm, {
    path: ['confirm'],
    params: { i18nKey: 'passwordMismatch' },
  })

export const requestPasswordResetSchema = z.object({
  email: z.email(),
})

export type Login = z.infer<typeof loginSchema>
export type SetPassword = z.infer<typeof setPasswordSchema>
export type RequestPasswordReset = z.infer<typeof requestPasswordResetSchema>
