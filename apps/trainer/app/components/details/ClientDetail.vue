<script setup lang="ts">
import type { Client } from '@macross/shared'
import { differenceInYears } from 'date-fns'

interface ClientDetailProps {
  client: Client
}

const { client } = defineProps<ClientDetailProps>()

const { t } = useI18n()
const { levelLabels, goalLabels } = useClientOptions()

const age = computed(() =>
  client.birthDate ? differenceInYears(new Date(), new Date(client.birthDate)) : null,
)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <UAvatar :src="client.avatarUrl ?? undefined" :alt="client.fullName" size="xl" />
      <p class="text-lg font-medium">{{ client.fullName }}</p>
    </div>

    <div>
      <h3 class="text-sm font-medium text-neutral-500">{{ t('clients.detail.email') }}</h3>
      <p class="mt-1">{{ client.email }}</p>
    </div>

    <div v-if="client.phone">
      <h3 class="text-sm font-medium text-neutral-500">{{ t('clients.detail.phone') }}</h3>
      <p class="mt-1">{{ client.phone }}</p>
    </div>

    <div v-if="client.trainer">
      <h3 class="text-sm font-medium text-neutral-500">{{ t('clients.detail.trainer') }}</h3>
      <ULink :to="`/trainers/${client.trainer.nanoId}`" class="text-primary mt-1 inline-block">
        {{ client.trainer.fullName }}
      </ULink>
    </div>

    <USeparator :label="t('clients.detail.trainingData')" />

    <div class="grid grid-cols-2 gap-6">
      <div v-if="age !== null">
        <h3 class="text-sm font-medium text-neutral-500">{{ t('clients.detail.age') }}</h3>
        <p class="mt-1">{{ age }} {{ t('clients.detail.ageUnit') }}</p>
      </div>
      <div v-if="client.desiredWeeklyFrequency">
        <h3 class="text-sm font-medium text-neutral-500">
          {{ t('clients.detail.desiredWeeklyFrequency') }}
        </h3>
        <p class="mt-1">{{ client.desiredWeeklyFrequency }} {{ t('clients.detail.daysUnit') }}</p>
      </div>
      <div v-if="client.weightKg">
        <h3 class="text-sm font-medium text-neutral-500">{{ t('clients.detail.weight') }}</h3>
        <p class="mt-1">{{ client.weightKg }} {{ t('clients.detail.kgUnit') }}</p>
      </div>
      <div v-if="client.heightCm">
        <h3 class="text-sm font-medium text-neutral-500">{{ t('clients.detail.height') }}</h3>
        <p class="mt-1">{{ client.heightCm }} {{ t('clients.detail.cmUnit') }}</p>
      </div>
      <div v-if="client.level">
        <h3 class="text-sm font-medium text-neutral-500">{{ t('clients.detail.level') }}</h3>
        <p class="mt-1">{{ levelLabels[client.level] }}</p>
      </div>
      <div v-if="client.goal?.length">
        <h3 class="text-sm font-medium text-neutral-500">{{ t('clients.detail.goals') }}</h3>
        <p class="mt-1">{{ client.goal.map(g => goalLabels[g]).join(', ') }}</p>
      </div>
    </div>

    <div v-if="client.injuries">
      <h3 class="text-sm font-medium text-neutral-500">{{ t('clients.detail.injuries') }}</h3>
      <p class="mt-1 whitespace-pre-wrap">{{ client.injuries }}</p>
    </div>

    <div v-if="client.availableEquipment">
      <h3 class="text-sm font-medium text-neutral-500">
        {{ t('clients.detail.availableEquipment') }}
      </h3>
      <p class="mt-1 whitespace-pre-wrap">{{ client.availableEquipment }}</p>
    </div>

    <template v-if="client.notes">
      <USeparator :label="t('clients.detail.trainerNotes')" />
      <p class="whitespace-pre-wrap">{{ client.notes }}</p>
    </template>
  </div>
</template>
