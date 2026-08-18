// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

import './env'

const namespaces = [
  'common',
  'nav',
  'filters',
  'dashboard',
  'validation',
  'auth',
  'clients',
  'exercises',
  'equipment',
  'muscle-groups',
  'trainers',
  'routines',
]

const isLocalDb = process.env.SUPABASE_URL?.includes('127.0.0.1')

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/supabase', '@vueuse/nuxt', '@nuxtjs/i18n'],
  alias: {
    '@macross/shared': fileURLToPath(new URL('../../packages/shared', import.meta.url)),
  },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-15',
  components: [{ path: '~/components', pathPrefix: false }],
  devtools: { enabled: true },
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'es',
    locales: [
      { code: 'es', name: 'Español', files: namespaces.map(n => `es/${n}.json`) },
      { code: 'en', name: 'English', files: namespaces.map(n => `en/${n}.json`) },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      fallbackLocale: 'es',
    },
  },
  icon: {
    clientBundle: { scan: true },
  },
  // Nuxt solo incluye test/nuxt/ en su contexto de TS; sin esto los unit tests no los ve `nuxt typecheck`
  typescript: {
    tsConfig: {
      include: ['../test/**/*'],
    },
  },
  supabase: {
    cookiePrefix: isLocalDb ? 'sb-trainer-local' : 'sb-trainer',
    redirect: false,
    types: '@macross/shared/types/database.ts',
    clientOptions: {
      auth: {
        detectSessionInUrl: false,
      },
    },
  },
  ui: {
    theme: {
      colors: ['primary', 'info', 'success', 'warning', 'error', 'neutral'],
    },
  },
  vite: {
    optimizeDeps: {
      include: ['date-fns', 'date-fns/locale', 'zod'],
    },
  },
})
