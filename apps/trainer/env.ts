import { createEnv } from '@t3-oss/env-nuxt'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NUXT_TRAINER_APP_URL: z.url(),
    NUXT_CLIENT_APP_URL: z.url(),
  },
  // `nuxt prepare` (postinstall) corre en todos los workspaces del monorepo y no tiene
  // las env del proyecto: salteamos validación ahí. `nuxt build` valida normalmente.
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
