<script setup lang="ts">
import { Roles, type Trainer } from '@macross/shared'

interface TrainerDetailProps {
  trainer: Trainer
}

const { trainer } = defineProps<TrainerDetailProps>()
const { t } = useI18n()
const { formatDate } = useFormatDate()

const roleLabel = computed(() =>
  trainer.role === Roles.trainer
    ? t('trainers.detail.roleTrainer')
    : t('trainers.detail.roleManager'),
)
</script>

<template>
  <div class="space-y-6">
    <BasePersonHero :name="trainer.fullName" :avatar-url="trainer.avatarUrl">
      <template #subtitle>
        <template v-if="trainer.phone">{{ trainer.phone }} · </template>
        {{ t('trainers.detail.joinedAt', { date: formatDate(trainer.createdAt, 'MMMM yyyy') }) }}
      </template>
      <template #pills>
        <BaseBadge
          :label="roleLabel"
          :color="trainer.role === Roles.trainer ? 'primary' : 'neutral'"
        />
      </template>
    </BasePersonHero>

    <div class="grid grid-cols-2 gap-3 sm:max-w-md">
      <BaseKPI
        :label="t('trainers.detail.activeClients')"
        :value="trainer.activeClients ?? 0"
        color="primary"
      />
      <BaseKPI :label="t('trainers.detail.totalClients')" :value="trainer.totalClients ?? 0" />
    </div>
  </div>
</template>
