<script setup lang="ts">
import { setPasswordSchema, type SetPassword } from '@macross/shared'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: 'auth', middleware: 'auth', title: 'auth.changePassword.title' })

const { t } = useI18n()

useHead({ title: t('auth.changePassword.title') })

const { changePassword } = useChangePassword()

const authForm = useTemplateRef('authForm')
useRevalidateOnLocale(() => authForm.value?.formRef ?? null)

const loading = ref(false)
const fields = computed<AuthFormField[]>(() => [
  {
    name: 'password',
    type: 'password',
    label: t('auth.changePassword.password'),
    placeholder: t('auth.changePassword.passwordPlaceholder'),
    required: true,
  },
  {
    name: 'confirm',
    type: 'password',
    label: t('auth.changePassword.confirm'),
    placeholder: t('auth.changePassword.confirmPlaceholder'),
    required: true,
  },
])

async function onSubmit(event: FormSubmitEvent<SetPassword>) {
  loading.value = true
  try {
    await changePassword(event.data)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-sm p-8">
    <AuthBrand class="text-4xl" />
    <p class="text-muted mt-1 mb-6 text-sm">{{ t('auth.changePassword.description') }}</p>

    <UAuthForm
      ref="authForm"
      :schema="setPasswordSchema"
      :fields
      :submit="{
        label: t('auth.changePassword.submit'),
        loading,
        size: 'lg',
        block: true,
      }"
      @submit="onSubmit"
    />

    <UButton
      :label="t('auth.changePassword.back')"
      to="/profile"
      variant="link"
      color="neutral"
      block
      class="mt-4"
    />
  </div>
</template>
