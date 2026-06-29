<script setup lang="ts">
const { t } = useI18n()

definePageMeta({
  middleware: 'auth',
  title: 'common.home.title',
})

useHead({ title: t('common.home.title') })

const user = useSupabaseUser()
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">{{ t('common.home.greeting') }}👋</h1>
    <p class="text-neutral-400">{{ user?.email }}</p>
    <UCard>
      <template #header>
        <h3 class="font-semibold">{{ t('common.home.routine.title') }}</h3>
      </template>
      <p class="text-sm text-neutral-400">{{ t('common.home.routine.comingSoon') }}</p>
    </UCard>
  </div>
</template>
