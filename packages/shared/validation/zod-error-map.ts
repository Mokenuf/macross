import type * as z from 'zod'

export type TranslateFn = (key: string, params?: Record<string, unknown>) => string

// Overridea solo los mensajes más comunes (los que el usuario ve en todos los forms) con wording
// propio; el resto cae al locale nativo de Zod (`z.locales`), sin mantenimiento. Los refines pasan
// su clave de traducción en `params.i18nKey` (sin `message`, así caen acá y no pisan el locale).
export function makeZodCustomError(t: TranslateFn): z.core.$ZodErrorMap {
  return issue => {
    if (issue.code === 'custom') {
      return t(`validation.${(issue.params?.i18nKey as string) ?? 'invalid'}`)
    }
    if (issue.code === 'invalid_type' && issue.input === undefined) {
      return t('validation.required')
    }
    if (issue.code === 'too_small' && issue.origin === 'string') {
      return issue.minimum === 1
        ? t('validation.required')
        : t('validation.minLength', { min: Number(issue.minimum) })
    }
    if (issue.code === 'invalid_format' && issue.format === 'email') {
      return t('validation.email')
    }
    return undefined
  }
}
