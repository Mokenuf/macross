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

const authForm = useTemplateRef('authForm')
useRevalidateOnLocale(() => authForm.value?.formRef ?? null)

const loading = ref(false)
const fields = computed<AuthFormField[]>(() => [
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
])

async function handleSubmit(event: FormSubmitEvent<Login>) {
  loading.value = true
  try {
    await login(event.data)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-sm p-8">
    <AuthBrand class="text-4xl" />
    <p class="text-muted mt-1 mb-6 text-sm">{{ t('auth.login.subtitle') }}</p>

    <UAuthForm
      ref="authForm"
      :schema="loginSchema"
      :fields
      :submit="{
        label: t('auth.login.submit'),
        loading,
        size: 'lg',
        block: true,
      }"
      @submit="handleSubmit"
    />

    <div class="mt-4 text-center">
      <ULink to="/auth/forgot-password" class="text-muted hover:text-primary text-sm">
        {{ t('auth.login.forgotPassword') }}
      </ULink>
    </div>
  </div>
</template>
