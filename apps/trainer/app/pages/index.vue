<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  title: 'nav.dashboard',
})

const { data: user } = useGetMe()
const { t } = useI18n()

const firstName = computed(() => user.value?.fullName?.split(' ')[0] ?? '')
</script>

<template>
  <BasePageHead v-if="user" :title="t('dashboard.greeting', { name: firstName })" />
</template>
