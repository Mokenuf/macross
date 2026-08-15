<script setup lang="ts">
import { setPasswordSchema, type SetPassword } from '@macross/shared'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: 'auth', title: 'auth.setPassword.title' })

const { t } = useI18n()

useHead({ title: t('auth.setPassword.title') })

const { setPassword } = useSetPassword()
const supabase = useSupabaseClient()

const authForm = useTemplateRef('authForm')
useRevalidateOnLocale(() => authForm.value?.formRef ?? null)

const loading = ref(false)
const fields = computed<AuthFormField[]>(() => [
  {
    name: 'password',
    type: 'password',
    label: t('auth.setPassword.password'),
    placeholder: t('auth.setPassword.passwordPlaceholder'),
    required: true,
  },
  {
    name: 'confirm',
    type: 'password',
    label: t('auth.setPassword.confirm'),
    placeholder: t('auth.setPassword.confirmPlaceholder'),
    required: true,
  },
])

onMounted(async () => {
  // Con detectSessionInUrl apagado el hash sobrevive hasta que lo leemos acá. Los tokens del invite
  // le ganan a cualquier sesión en cookies: si no, quien ya estaba logueado abre el link y termina
  // cambiándose su propia contraseña.
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
  <div class="w-full max-w-sm p-8">
    <AuthBrand class="text-4xl" />
    <p class="text-muted mt-1 mb-6 text-sm">{{ t('auth.setPassword.description') }}</p>

    <UAuthForm
      ref="authForm"
      :schema="setPasswordSchema"
      :fields
      :submit="{
        label: t('auth.setPassword.submit'),
        loading,
        size: 'lg',
        block: true,
      }"
      @submit="onSubmit"
    />
  </div>
</template>
