<script setup lang="ts">
import { loginSchema, type Login } from '@macross/shared'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
  title: 'auth.login.title',
})

const { t } = useI18n()
const { login } = useLogin()

const authForm = useTemplateRef('authForm')
useRevalidateOnLocale(() => authForm.value?.formRef ?? null)

const loading = ref(false)
const error = ref('')
const fields = computed<AuthFormField[]>(() => [
  {
    name: 'email',
    type: 'email',
    label: t('auth.login.emailLabel'),
    placeholder: t('auth.login.emailPlaceholder'),
    required: true,
  },
  {
    name: 'password',
    type: 'password',
    label: t('auth.login.passwordLabel'),
    placeholder: t('auth.login.passwordPlaceholder'),
    required: true,
  },
])

async function handleSubmit(event: FormSubmitEvent<Login>) {
  loading.value = true
  error.value = ''

  try {
    await login(event.data)
  } catch (e) {
    error.value = t('auth.login.errorInvalidCredentials')
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
      <p class="mt-1 text-sm text-neutral-400">{{ t('auth.layout.subtitle') }}</p>
    </div>

    <UAuthForm
      ref="authForm"
      :schema="loginSchema"
      :fields
      icon="i-lucide-log-in"
      :submit="{
        label: t('auth.login.submit'),
        loading,
        size: 'lg',
        block: true,
      }"
      @submit="handleSubmit"
    />

    <div class="mt-4 text-center">
      <ULink to="/auth/forgot-password" class="hover:text-primary text-sm text-neutral-400">
        {{ t('auth.login.forgotPasswordLink') }}
      </ULink>
    </div>
  </div>
</template>
