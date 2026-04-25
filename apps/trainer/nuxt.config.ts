// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/supabase', '@vueuse/nuxt'],
  alias: {
    '@macross/shared': fileURLToPath(new URL('../../packages/shared', import.meta.url)),
  },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  components: [{ path: '~/components', pathPrefix: false }],
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'info', 'success', 'warning', 'error', 'neutral'],
    },
  },
  supabase: {
    redirect: false,
    types: '@macross/shared/types/database.ts',
  },
  vite: {
    optimizeDeps: {
      include: ['zod'],
    },
  },
  runtimeConfig: {
    trainerAppUrl: '',
  },
})
