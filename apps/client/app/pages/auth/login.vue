<script setup lang="ts">
import { loginSchema, type Login } from '@macross/shared'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
  title: 'auth.login.title',
})

const { t } = useI18n()

useHead({ title: t('auth.login.title') })

const { login } = useLogin()

const loading = ref(false)
const error = ref('')
const fields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: t('auth.login.email'),
    placeholder: t('auth.login.emailPlaceholder'),
    required: true,
  },
  {
    name: 'password',
    type: 'password',
    label: t('auth.login.password'),
    placeholder: t('auth.login.passwordPlaceholder'),
    required: true,
  },
]

async function handleSubmit(event: FormSubmitEvent<Login>) {
  loading.value = true
  error.value = ''

  try {
    await login(event.data)
  } catch (e) {
    error.value = t('auth.errors.invalidCredentials')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-sm p-8">
    <div class="mb-8 text-center">
      <h1 class="font-logo text-primary text-2xl font-bold tracking-widest uppercase">
        Macros for progress
      </h1>
    </div>

    <UAuthForm
      :schema="loginSchema"
      :fields
      icon="i-lucide-log-in"
      :submit="{
        label: t('auth.login.submit'),
        loading,
        size: 'lg',
        block: true,
        class: 'cursor-pointer',
      }"
      @submit="handleSubmit"
    />

    <div class="mt-4 text-center">
      <ULink to="/auth/forgot-password" class="hover:text-primary text-muted text-sm">
        {{ t('auth.login.forgotPassword') }}
      </ULink>
    </div>
  </div>
</template>
