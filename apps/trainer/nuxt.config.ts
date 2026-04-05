// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ui: {
    theme: {
      colors: [
        'primary',
        'secondary',
        'tertiary',
        'info',
        'success',
        'warning',
        'error',
        'neutral',
      ],
    },
  },
  supabase: {
    redirect: false,
    types: '../../../packages/shared/types/database.ts',
  },
  vite: {
    optimizeDeps: {
      include: ['zod'],
    },
  },
})
