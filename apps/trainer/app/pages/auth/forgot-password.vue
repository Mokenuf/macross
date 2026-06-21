<script setup lang="ts">
import { requestPasswordResetSchema, type RequestPasswordReset } from '@macross/shared'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})

useHead({ title: 'Recuperar contraseña' })

const { requestPasswordReset } = useRequestPasswordReset()

const loading = ref(false)
const fields: AuthFormField[] = [
  { name: 'email', type: 'email', label: 'Email', placeholder: 'Ingresa tu email', required: true },
]

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
      <p class="mt-1 text-sm text-neutral-400">Recuperar contraseña</p>
    </div>

    <UAuthForm
      :schema="requestPasswordResetSchema"
      :fields
      icon="i-lucide-mail"
      :submit="{ label: 'Enviar link', loading, size: 'lg', block: true, class: 'cursor-pointer' }"
      @submit="handleSubmit"
    />

    <div class="mt-4 text-center">
      <ULink to="/auth/login" class="hover:text-primary text-sm text-neutral-400">
        Volver a iniciar sesión
      </ULink>
    </div>
  </div>
</template>
