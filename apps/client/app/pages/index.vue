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
    <div>
      <h1 class="font-logo text-3xl tracking-wider uppercase">
        {{ t('common.home.greeting') }} 👋
      </h1>
      <p class="text-muted text-sm">{{ user?.email }}</p>
    </div>
    <UCard>
      <template #header>
        <h3 class="font-semibold">{{ t('common.home.routine.title') }}</h3>
      </template>
      <p class="text-muted text-sm">{{ t('common.home.routine.comingSoon') }}</p>
    </UCard>
  </div>
</template>
