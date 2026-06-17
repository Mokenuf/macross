<script setup lang="ts">
import { setPasswordSchema, type SetPassword } from '@macross/shared'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: 'auth' })

useHead({ title: 'Establecer contraseña' })

const { setPassword } = useSetPassword()
const supabase = useSupabaseClient()

const loading = ref(false)
const fields: AuthFormField[] = [
  {
    name: 'password',
    type: 'password',
    label: 'Contraseña',
    placeholder: 'Mínimo 8 caracteres',
    required: true,
  },
  {
    name: 'confirm',
    type: 'password',
    label: 'Repetir contraseña',
    placeholder: 'Repetí tu contraseña',
    required: true,
  },
]

onMounted(async () => {
  // detectSessionInUrl is off, so the hash survives until we read it here.
  // Invite tokens always win over any session in cookies.
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

async function onSubmit(event: FormSubmitEvent<SetPassword>) {
  loading.value = true
  try {
    await setPassword(event.data)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-sm p-4">
    <div class="bg-surface border-macross-gray-800 rounded-2xl border p-8 shadow-2xl">
      <div class="mb-6 text-center">
        <h1 class="font-logo text-primary text-2xl font-bold tracking-widest uppercase">
          Macros for progress
        </h1>
        <p class="text-muted mt-2 text-sm">Creá tu contraseña para empezar a entrenar</p>
      </div>

      <UAuthForm
        :schema="setPasswordSchema"
        :fields
        icon="i-lucide-lock"
        :submit="{
          label: 'Guardar contraseña',
          loading,
          size: 'lg',
          block: true,
          class: 'cursor-pointer',
        }"
        @submit="onSubmit"
      />
    </div>
  </div>
</template>
