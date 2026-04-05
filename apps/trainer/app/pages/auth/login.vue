<script setup lang="ts">
import { loginSchema, type Login } from '@macross/shared'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})

useHead({ title: 'Iniciar sesión' })

const { login } = useLogin()

const loading = ref(false)
const error = ref('')
const fields: AuthFormField[] = [
  { name: 'email', type: 'email', label: 'Email', placeholder: 'Ingresa tu email', required: true },
  {
    name: 'password',
    type: 'password',
    label: 'Contraseña',
    placeholder: 'Ingresa tu contraseña',
    required: true,
  },
]

async function handleSubmit(event: FormSubmitEvent<Login>) {
  loading.value = true
  error.value = ''

  try {
    await login(event.data)
  } catch (e) {
    error.value = 'Email o contraseña incorrectos'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-sm p-8">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold tracking-widest font-logo text-primary uppercase">
        Macros for progress
      </h1>
      <p class="text-sm text-neutral-400 mt-1">Panel de entrenador</p>
    </div>

    <UAuthForm
      :schema="loginSchema"
      :fields
      icon="i-lucide-log-in"
      :submit="{ label: 'Ingresar', loading, size: 'lg', block: true, class: 'cursor-pointer' }"
      @submit="handleSubmit"
    />
  </div>
</template>
