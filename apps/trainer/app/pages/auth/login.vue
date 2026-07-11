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

  try {
    await login(event.data)
  } catch {
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthCard :subtitle="t('auth.layout.subtitle')">
    <UAuthForm
      ref="authForm"
      :schema="loginSchema"
      :fields
      :submit="{ label: t('auth.login.submit'), loading, size: 'lg', block: true }"
      @submit="handleSubmit"
    />

    <div class="mt-4 text-center">
      <ULink to="/auth/forgot-password" class="text-muted hover:text-primary text-sm">
        {{ t('auth.login.forgotPasswordLink') }}
      </ULink>
    </div>
  </AuthCard>
</template>
