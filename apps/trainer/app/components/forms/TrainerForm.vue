<script setup lang="ts">
import {
  createTrainerSchema,
  updateTrainerSchema,
  type CreateTrainer,
  type Trainer,
  type UpdateTrainer,
} from '@macross/shared'
import type { FormSubmitEvent } from '@nuxt/ui'

interface TrainerFormProps {
  loading?: boolean
  trainer?: Trainer
}
interface TrainerFormEmits {
  submit: [payload: CreateTrainer | UpdateTrainer]
}

const { trainer, loading = false } = defineProps<TrainerFormProps>()
const emit = defineEmits<TrainerFormEmits>()

const { t } = useI18n()

const form = useTemplateRef('form')
useRevalidateOnLocale(() => form.value)

const isEdit = computed(() => !!trainer)
const schema = computed(() => (isEdit.value ? updateTrainerSchema : createTrainerSchema))

const state = reactive<Partial<CreateTrainer & UpdateTrainer>>({
  fullName: trainer?.fullName ?? '',
  email: trainer?.email ?? '',
  phone: trainer?.phone ?? '',
  avatarUrl: trainer?.avatarUrl ?? '',
})

function onSubmit(event: FormSubmitEvent<CreateTrainer | UpdateTrainer>) {
  emit('submit', event.data)
}
</script>

<template>
  <UForm ref="form" :schema :state class="space-y-4" @submit="onSubmit">
    <UFormField :label="t('trainers.form.fullNameLabel')" name="fullName" required>
      <UInput
        v-model="state.fullName"
        :placeholder="t('trainers.form.fullNamePlaceholder')"
        class="w-full"
      />
    </UFormField>
    <UFormField v-if="!isEdit" :label="t('trainers.form.emailLabel')" name="email" required>
      <UInput
        v-model="state.email"
        type="email"
        :placeholder="t('trainers.form.emailPlaceholder')"
        class="w-full"
      />
    </UFormField>
    <UFormField :label="t('trainers.form.phoneLabel')" name="phone">
      <UInput
        v-model="state.phone"
        :placeholder="t('trainers.form.phonePlaceholder')"
        class="w-full"
      />
    </UFormField>
    <UFormField v-if="isEdit" :label="t('trainers.form.avatarUrlLabel')" name="avatarUrl">
      <UInput
        v-model="state.avatarUrl"
        :placeholder="t('trainers.form.avatarUrlPlaceholder')"
        class="w-full"
      />
    </UFormField>
    <div class="flex justify-end gap-3">
      <UButton
        class="cursor-pointer"
        :label="t('common.actions.cancel')"
        color="neutral"
        variant="ghost"
        to="/trainers"
      />
      <UButton
        class="cursor-pointer"
        type="submit"
        :label="isEdit ? t('trainers.form.saveChanges') : t('trainers.form.inviteTrainer')"
        :loading
      />
    </div>
  </UForm>
</template>
