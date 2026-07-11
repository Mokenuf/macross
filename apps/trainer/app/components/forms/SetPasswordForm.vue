<script setup lang="ts">
import { setPasswordSchema, type SetPassword } from '@macross/shared'
import type { FormSubmitEvent } from '@nuxt/ui'

interface SetPasswordFormProps {
  loading: boolean
}

interface SetPasswordFormEmits {
  submit: [payload: SetPassword]
}

const { t } = useI18n()
const { loading } = defineProps<SetPasswordFormProps>()
const emit = defineEmits<SetPasswordFormEmits>()

const form = useTemplateRef('form')
useRevalidateOnLocale(() => form.value)

const state = reactive<Partial<SetPassword>>({ password: '', confirm: '' })

function onSubmit(event: FormSubmitEvent<SetPassword>) {
  emit('submit', event.data)
}
</script>

<template>
  <UForm ref="form" :schema="setPasswordSchema" :state class="space-y-4" @submit="onSubmit">
    <UFormField :label="t('auth.setPassword.passwordLabel')" name="password" required>
      <UInput v-model="state.password" type="password" class="w-full" />
    </UFormField>

    <UFormField :label="t('auth.setPassword.confirmPasswordLabel')" name="confirm" required>
      <UInput v-model="state.confirm" type="password" class="w-full" />
    </UFormField>

    <UButton type="submit" :label="t('common.actions.save')" :loading size="lg" block />
  </UForm>
</template>
