import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('El email no es válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const setPasswordSchema = z
  .object({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirm: z.string(),
  })
  .refine(data => data.password === data.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })

export type Login = z.infer<typeof loginSchema>
export type SetPassword = z.infer<typeof setPasswordSchema>
