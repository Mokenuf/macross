<script setup lang="ts">
import type { SetPassword } from '@macross/shared'

definePageMeta({ layout: 'auth', title: 'auth.resetPassword.title' })

const { t } = useI18n()
const { setPassword } = useSetPassword()
const supabase = useSupabaseClient()

const loading = ref(false)

onMounted(async () => {
  // detectSessionInUrl is off, so the hash survives until we read it here.
  // Recovery tokens always win over any session in cookies.
  const hash = window.location.hash
  if (!hash.includes('access_token')) return

  const params = new URLSearchParams(hash.slice(1))
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (!accessToken || !refreshToken) return

  await supabase.auth.signOut({ scope: 'local' })
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  // Drop the tokens from the URL so they don't linger in the address bar / history.
  if (!error) window.history.replaceState(null, '', window.location.pathname)
})

async function onSubmit(data: SetPassword) {
  loading.value = true
  try {
    await setPassword(data)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthCard :subtitle="t('auth.resetPassword.description')">
    <SetPasswordForm :loading @submit="onSubmit" />
  </AuthCard>
</template>
