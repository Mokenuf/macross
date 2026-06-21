import { createEnv } from '@t3-oss/env-nuxt'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NUXT_TRAINER_APP_URL: z.url(),
    NUXT_CLIENT_APP_URL: z.url(),
  },
})
