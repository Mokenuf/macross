// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

import './env'

const namespaces = ['common', 'nav', 'auth', 'validation']

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/supabase', '@nuxtjs/i18n', '@vite-pwa/nuxt'],
  alias: {
    '@macross/shared': fileURLToPath(new URL('../../packages/shared', import.meta.url)),
  },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: {
    port: 3001,
  },
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
  pwa: {
    registerType: 'autoUpdate',
    pwaAssets: { config: true },
    manifest: {
      name: 'Macros for Progress',
      short_name: 'M4P',
      description: 'Tu planificación de entrenamiento',
      lang: 'es',
      display: 'standalone',
      start_url: '/',
      background_color: '#0c0b09',
      theme_color: '#0c0b09',
    },
    workbox: {
      globPatterns: ['**/*.{js,css,svg,png,ico,woff2}'],
    },
    devOptions: { enabled: false },
  },
  supabase: {
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
      colors: ['primary', 'secondary', 'info', 'success', 'warning', 'error', 'neutral'],
    },
  },
  vite: {
    optimizeDeps: {
      include: ['zod'],
    },
  },
})
