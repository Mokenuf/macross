<script setup lang="ts">
import { requestPasswordResetSchema, type RequestPasswordReset } from '@macross/shared'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
  title: 'auth.forgotPassword.title',
})

const { t } = useI18n()
const { requestPasswordReset } = useRequestPasswordReset()

const loading = ref(false)
const fields = computed<AuthFormField[]>(() => [
  {
    name: 'email',
    type: 'email',
    label: t('auth.forgotPassword.emailLabel'),
    placeholder: t('auth.forgotPassword.emailPlaceholder'),
    required: true,
  },
])

async function handleSubmit(event: FormSubmitEvent<RequestPasswordReset>) {
  loading.value = true

  try {
    await requestPasswordReset(event.data)
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
      <p class="mt-1 text-sm text-neutral-400">{{ t('auth.layout.forgotPasswordSubtitle') }}</p>
    </div>

    <UAuthForm
      :schema="requestPasswordResetSchema"
      :fields
      icon="i-lucide-mail"
      :submit="{
        label: t('auth.forgotPassword.submit'),
        loading,
        size: 'lg',
        block: true,
        class: 'cursor-pointer',
      }"
      @submit="handleSubmit"
    />

    <div class="mt-4 text-center">
      <ULink to="/auth/login" class="hover:text-primary text-sm text-neutral-400">
        {{ t('auth.forgotPassword.backToLogin') }}
      </ULink>
    </div>
  </div>
</template>
