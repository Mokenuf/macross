import { makeZodCustomError, type TranslateFn } from '@macross/shared'
import * as z from 'zod'

export default defineNuxtPlugin(nuxtApp => {
  const i18n = nuxtApp.$i18n as { locale: Ref<string>; t: TranslateFn }
  const customError = makeZodCustomError((key, params) => i18n.t(key, params ?? {}))

  function applyLocale(locale: string) {
    z.config({ ...(locale === 'en' ? z.locales.en() : z.locales.es()), customError })
  }

  applyLocale(i18n.locale.value)
  watch(i18n.locale, applyLocale)
})
