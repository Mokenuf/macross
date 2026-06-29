<script setup lang="ts">
import {
  createClientSchema,
  updateClientSchema,
  Roles,
  type BaseResponse,
  type Client,
  type CreateClient,
  type Trainer,
  type UpdateClient,
} from '@macross/shared'
import type { FormSubmitEvent } from '@nuxt/ui'

interface ClientFormProps {
  loading?: boolean
  client?: Client
}
interface ClientFormEmits {
  submit: [payload: CreateClient | UpdateClient]
}

const { client, loading = false } = defineProps<ClientFormProps>()
const emit = defineEmits<ClientFormEmits>()

const { t } = useI18n()
const { data: me } = useGetMe()
const isManager = computed(() => me.value?.role === Roles.manager)

const { data: trainersData } = useFetch<BaseResponse<Trainer>>('/api/trainers', {
  key: 'trainers-select',
  query: { limit: 100 },
})

// v-model objeto (no id) para que el label no dependa del fetch (evita el flash del UUID crudo)
const selectedTrainer = ref<{ id: string; fullName: string } | undefined>(
  client?.trainer ? { id: client.trainer.id, fullName: client.trainer.fullName } : undefined,
)

const trainerItems = computed(() => {
  const fetched = (trainersData.value?.rows ?? []).map(tr => ({ id: tr.id, fullName: tr.fullName }))
  if (selectedTrainer.value && !fetched.some(tr => tr.id === selectedTrainer.value!.id)) {
    fetched.unshift(selectedTrainer.value)
  }
  return fetched
})

const { levelOptions, goalOptions } = useClientOptions()

const form = useTemplateRef('form')
useRevalidateOnLocale(() => form.value)

const isEdit = computed(() => !!client)
const schema = computed(() => (isEdit.value ? updateClientSchema : createClientSchema))

const state = reactive<Partial<CreateClient & UpdateClient>>({
  fullName: client?.fullName ?? '',
  email: client?.email ?? '',
  phone: client?.phone ?? '',
  trainerId: client?.trainerId ?? undefined,
  avatarUrl: client?.avatarUrl ?? '',
  birthDate: client?.birthDate ?? undefined,
  weightKg: client?.weightKg ?? undefined,
  heightCm: client?.heightCm ?? undefined,
  level: client?.level ?? undefined,
  goal: client?.goal ?? [],
  desiredWeeklyFrequency: client?.desiredWeeklyFrequency ?? undefined,
  injuries: client?.injuries ?? undefined,
  availableEquipment: client?.availableEquipment ?? undefined,
  notes: client?.notes ?? undefined,
})

watch(selectedTrainer, tr => {
  state.trainerId = tr?.id
})

function onSubmit(event: FormSubmitEvent<CreateClient | UpdateClient>) {
  emit('submit', event.data)
}
</script>

<template>
  <UForm ref="form" :schema :state class="space-y-4" @submit="onSubmit">
    <UFormField :label="t('clients.form.fullName')" name="fullName" required>
      <UInput
        v-model="state.fullName"
        :placeholder="t('clients.form.fullNamePlaceholder')"
        class="w-full"
      />
    </UFormField>
    <UFormField v-if="!isEdit" :label="t('clients.form.email')" name="email" required>
      <UInput
        v-model="state.email"
        type="email"
        :placeholder="t('clients.form.emailPlaceholder')"
        class="w-full"
      />
    </UFormField>
    <UFormField v-if="isManager" :label="t('clients.form.trainer')" name="trainerId" required>
      <USelectMenu
        v-model="selectedTrainer"
        :items="trainerItems"
        by="id"
        label-key="fullName"
        :placeholder="t('clients.form.trainerPlaceholder')"
        class="w-full"
      />
    </UFormField>
    <UFormField :label="t('clients.form.phone')" name="phone">
      <UInput
        v-model="state.phone"
        :placeholder="t('clients.form.phonePlaceholder')"
        class="w-full"
      />
    </UFormField>
    <UFormField v-if="isEdit" :label="t('clients.form.avatarUrl')" name="avatarUrl">
      <UInput
        v-model="state.avatarUrl"
        :placeholder="t('clients.form.avatarUrlPlaceholder')"
        class="w-full"
      />
    </UFormField>

    <USeparator :label="t('clients.form.sections.trainingData')" />

    <div class="grid grid-cols-2 gap-4">
      <UFormField :label="t('clients.form.birthDate')" name="birthDate">
        <UInput v-model="state.birthDate" type="date" class="w-full" />
      </UFormField>
      <UFormField :label="t('clients.form.desiredWeeklyFrequency')" name="desiredWeeklyFrequency">
        <UInput
          v-model="state.desiredWeeklyFrequency"
          type="number"
          min="1"
          max="7"
          :placeholder="t('clients.form.desiredWeeklyFrequencyPlaceholder')"
          class="w-full"
        />
      </UFormField>
      <UFormField :label="t('clients.form.weightKg')" name="weightKg">
        <UInput
          v-model="state.weightKg"
          type="number"
          step="0.1"
          :placeholder="t('clients.form.weightKgPlaceholder')"
          class="w-full"
        />
      </UFormField>
      <UFormField :label="t('clients.form.heightCm')" name="heightCm">
        <UInput
          v-model="state.heightCm"
          type="number"
          :placeholder="t('clients.form.heightCmPlaceholder')"
          class="w-full"
        />
      </UFormField>
      <UFormField :label="t('clients.form.level')" name="level">
        <USelectMenu
          v-model="state.level"
          :items="levelOptions"
          value-key="value"
          :search-input="false"
          :placeholder="t('clients.form.levelPlaceholder')"
          class="w-full"
        />
      </UFormField>
      <UFormField :label="t('clients.form.goals')" name="goal">
        <USelectMenu
          v-model="state.goal"
          :items="goalOptions"
          value-key="value"
          multiple
          :search-input="false"
          :placeholder="t('clients.form.goalsPlaceholder')"
          class="w-full"
        />
      </UFormField>
    </div>
    <UFormField :label="t('clients.form.injuries')" name="injuries">
      <UTextarea
        v-model="state.injuries"
        :placeholder="t('clients.form.injuriesPlaceholder')"
        class="w-full"
      />
    </UFormField>
    <UFormField :label="t('clients.form.availableEquipment')" name="availableEquipment">
      <UTextarea
        v-model="state.availableEquipment"
        :placeholder="t('clients.form.availableEquipmentPlaceholder')"
        class="w-full"
      />
    </UFormField>

    <template v-if="isEdit">
      <USeparator :label="t('clients.form.sections.trainerNotes')" />
      <UFormField :label="t('clients.form.notes')" name="notes">
        <UTextarea
          v-model="state.notes"
          :rows="4"
          :placeholder="t('clients.form.notesPlaceholder')"
          class="w-full"
        />
      </UFormField>
    </template>

    <div class="flex justify-end gap-3">
      <UButton
        class="cursor-pointer"
        :label="t('clients.form.buttons.cancel')"
        color="neutral"
        variant="ghost"
        to="/clients"
      />
      <UButton
        class="cursor-pointer"
        type="submit"
        :label="
          isEdit ? t('clients.form.buttons.saveChanges') : t('clients.form.buttons.inviteClient')
        "
        :loading
      />
    </div>
  </UForm>
</template>
