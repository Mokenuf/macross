<script setup lang="ts">
const { t } = useI18n()

definePageMeta({
  middleware: 'auth',
  title: 'nav.plan',
})

useHead({ title: t('nav.plan') })
</script>

<template>
  <div class="space-y-3">
    <h1 class="font-logo text-3xl tracking-wider uppercase">{{ t('nav.plan') }}</h1>
    <p class="text-muted text-sm">{{ t('common.home.routine.comingSoon') }}</p>
  </div>
</template>
