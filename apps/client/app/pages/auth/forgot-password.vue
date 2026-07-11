<script setup lang="ts">
import { requestPasswordResetSchema, type RequestPasswordReset } from '@macross/shared'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
  title: 'auth.forgotPassword.title',
})

const { t } = useI18n()

useHead({ title: t('auth.forgotPassword.title') })

const { requestPasswordReset } = useRequestPasswordReset()

const authForm = useTemplateRef('authForm')
useRevalidateOnLocale(() => authForm.value?.formRef ?? null)

const loading = ref(false)
const fields = computed<AuthFormField[]>(() => [
  {
    name: 'email',
    type: 'email',
    label: t('auth.forgotPassword.email'),
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
    <AuthBrand class="text-4xl" />
    <p class="text-muted mt-1 mb-6 text-sm">{{ t('auth.forgotPassword.description') }}</p>

    <UAuthForm
      ref="authForm"
      :schema="requestPasswordResetSchema"
      :fields
      :submit="{
        label: t('auth.forgotPassword.submit'),
        loading,
        size: 'lg',
        block: true,
      }"
      @submit="handleSubmit"
    />

    <div class="mt-4 text-center">
      <ULink to="/auth/login" class="text-muted hover:text-primary text-sm">
        {{ t('auth.forgotPassword.backToLogin') }}
      </ULink>
    </div>
  </div>
</template>
