<script setup lang="ts">
import type { SetPassword } from '@macross/shared'

definePageMeta({ layout: 'auth', title: 'auth.resetPassword.title' })

const { t } = useI18n()
const { setPassword } = useSetPassword()
const supabase = useSupabaseClient()

const loading = ref(false)

onMounted(async () => {
  // Con detectSessionInUrl apagado el hash sobrevive hasta que lo leemos acá. Los tokens del
  // recovery le ganan a cualquier sesión en cookies.
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

  // Sacar los tokens de la URL para que no queden en la barra de direcciones ni en el historial.
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
