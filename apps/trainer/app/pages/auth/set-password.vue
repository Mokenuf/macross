<script setup lang="ts">
import type { SetPassword } from '@macross/shared'

definePageMeta({ layout: 'auth', title: 'Establecer contraseña' })

const { setPassword } = useSetPassword()
const supabase = useSupabaseClient()
const currentUser = useSupabaseUser()

const loading = ref(false)

onMounted(async () => {
  // Hash already processed, if active sesion does not match with guest (prev sesion in cookies), force local signOut and reset with hash tokens.
  const hash = window.location.hash
  if (!hash.includes('access_token')) return

  const params = new URLSearchParams(hash.slice(1))
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (!accessToken || !refreshToken) return

  // Decode JWT payload (just to compare sub)
  const parts = accessToken.split('.')
  if (parts.length !== 3 || !parts[1]) return
  const payload = JSON.parse(atob(parts[1]))
  const invitedSub = payload.sub as string

  if (currentUser?.value?.sub !== invitedSub) {
    await supabase.auth.signOut({ scope: 'local' })
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
  }
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
  <div class="w-full max-w-md">
    <h1 class="mb-6 text-2xl font-bold">Establecer contraseña</h1>
    <p class="mb-6 text-sm text-neutral-500">
      Bienvenido a Macros for progress. Para continuar, establece una contraseña para tu cuenta.
    </p>
    <SetPasswordForm :loading @submit="onSubmit" />
  </div>
</template>
