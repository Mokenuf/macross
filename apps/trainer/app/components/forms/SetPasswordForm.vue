<script setup lang="ts">
import { setPasswordSchema, type SetPassword } from '@macross/shared'
import type { FormSubmitEvent } from '@nuxt/ui'

interface SetPasswordFormProps {
  loading: boolean
}

interface SetPasswordFormEmits {
  submit: [payload: SetPassword]
}

const { loading } = defineProps<SetPasswordFormProps>()
const emit = defineEmits<SetPasswordFormEmits>()

const state = reactive<Partial<SetPassword>>({ password: '', confirm: '' })

function onSubmit(event: FormSubmitEvent<SetPassword>) {
  emit('submit', event.data)
}
</script>

<template>
  <UForm :schema="setPasswordSchema" :state class="space-y-4" @submit="onSubmit">
    <UFormField label="Contraseña" name="password" required>
      <UInput v-model="state.password" type="password" class="w-full" />
    </UFormField>

    <UFormField label="Repetir contraseña" name="confirm" required>
      <UInput v-model="state.confirm" type="password" class="w-full" />
    </UFormField>

    <UButton type="submit" label="Guardar" :loading block />
  </UForm>
</template>
