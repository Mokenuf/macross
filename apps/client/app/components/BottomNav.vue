<script setup lang="ts">
interface NavItem {
  label: string
  icon: string
  to: string
}

const route = useRoute()
const { t } = useI18n()

const items = computed<NavItem[]>(() => [
  { label: t('nav.today'), icon: 'i-lucide-house', to: '/' },
  { label: t('nav.plan'), icon: 'i-lucide-clipboard-list', to: '/plan' },
  { label: t('nav.profile'), icon: 'i-lucide-user', to: '/profile' },
])

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}
</script>

<template>
  <nav class="bg-default border-default fixed inset-x-0 bottom-0 z-40 flex border-t">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors"
      :class="isActive(item.to) ? 'text-primary' : 'text-dimmed hover:text-muted'"
    >
      <UIcon :name="item.icon" class="size-5" />
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>
