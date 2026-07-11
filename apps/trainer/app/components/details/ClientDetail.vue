<script setup lang="ts">
import type { Client } from '@macross/shared'
import { differenceInYears } from 'date-fns'

interface ClientDetailProps {
  client: Client
}

const { client } = defineProps<ClientDetailProps>()

const { t } = useI18n()
const { formatDate } = useFormatDate()
const { levelLabels, goalLabels } = useClientOptions()

const age = computed(() =>
  client.birthDate ? differenceInYears(new Date(), new Date(client.birthDate)) : null,
)

const hasKpis = computed(
  () =>
    age.value !== null || !!client.weightKg || !!client.heightCm || !!client.desiredWeeklyFrequency,
)

const notes = computed(() =>
  [
    { label: t('clients.detail.injuries'), text: client.injuries },
    { label: t('clients.detail.availableEquipment'), text: client.availableEquipment },
    { label: t('clients.detail.notes'), text: client.notes },
  ].filter(n => n.text),
)
</script>

<template>
  <div class="space-y-6">
    <BasePersonHero :name="client.fullName" :avatar-url="client.avatarUrl">
      <template #subtitle>
        {{ t('clients.detail.joinedAt', { date: formatDate(client.createdAt, 'MMMM yyyy') }) }}
        <template v-if="client.trainer">
          · {{ t('clients.detail.trainer') }}:
          <ULink :to="`/trainers/${client.trainer.nanoId}`" class="text-primary">
            {{ client.trainer.fullName }}
          </ULink>
        </template>
      </template>
      <template #pills>
        <BaseBadge
          :color="client.deletedAt ? 'error' : 'success'"
          :label="client.deletedAt ? t('common.status.deleted') : t('common.status.active')"
          shape="pill"
        />
        <BaseBadge v-if="client.level" :label="levelLabels[client.level]" color="neutral" />
        <BaseBadgeList
          v-if="client.goal?.length"
          :items="client.goal.map(g => goalLabels[g])"
          color="primary"
          :max="99"
        />
      </template>
    </BasePersonHero>

    <div v-if="hasKpis" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <BaseKPI
        v-if="age !== null"
        :label="t('clients.detail.age')"
        :value="age"
        :unit="t('clients.detail.ageUnit')"
      />
      <BaseKPI
        v-if="client.weightKg"
        :label="t('clients.detail.weight')"
        :value="client.weightKg"
        :unit="t('clients.detail.kgUnit')"
        color="primary"
      />
      <BaseKPI
        v-if="client.heightCm"
        :label="t('clients.detail.height')"
        :value="client.heightCm"
        :unit="t('clients.detail.cmUnit')"
      />
      <BaseKPI
        v-if="client.desiredWeeklyFrequency"
        :label="t('clients.detail.frequency')"
        :value="client.desiredWeeklyFrequency"
        :unit="t('clients.detail.frequencyUnit')"
      />
    </div>

    <div v-for="n in notes" :key="n.label">
      <p class="text-dimmed mb-2 text-[11px] font-semibold tracking-widest uppercase">
        {{ n.label }}
      </p>
      <p
        class="bg-elevated border-default text-muted rounded-md border px-3.5 py-3 text-[13px] leading-relaxed whitespace-pre-wrap"
      >
        {{ n.text }}
      </p>
    </div>
  </div>
</template>
