<script setup lang="ts">
const { t } = useI18n()

definePageMeta({
  middleware: 'auth',
  title: 'common.home.title',
})

const { routine, loading } = useGetActiveRoutine()

useHead({ title: t('common.home.title') })
</script>

<template>
  <div class="space-y-5">
    <header class="space-y-0.5">
      <p class="text-dimmed text-sm">{{ t('common.home.greeting') }} 👋</p>
      <template v-if="routine">
        <p class="text-primary pt-1 text-xs font-semibold tracking-widest uppercase">
          {{ t('common.home.activePhase') }}
        </p>
        <h1 class="font-logo text-4xl leading-none tracking-wide uppercase">{{ routine.name }}</h1>
      </template>
    </header>

    <div v-if="loading" class="bg-muted ring-accented h-28 animate-pulse rounded-xl ring-1" />

    <UButton
      v-else-if="routine"
      :label="t('common.home.viewPlan')"
      to="/plan"
      size="xl"
      block
      trailing-icon="i-lucide-arrow-right"
    />

    <div v-else class="bg-muted ring-accented space-y-2 rounded-xl p-6 text-center ring-1">
      <UIcon name="i-lucide-clipboard-list" class="text-dimmed size-8" />
      <p class="text-default font-semibold">{{ t('plan.empty.title') }}</p>
      <p class="text-muted text-sm">{{ t('plan.empty.description') }}</p>
    </div>
  </div>
</template>
