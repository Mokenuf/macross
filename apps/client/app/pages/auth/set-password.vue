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
