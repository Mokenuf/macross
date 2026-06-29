<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const { data: user } = useGetMe()

const { t, te } = useI18n()

const avatarText = computed(() => user?.value?.email?.charAt(0).toUpperCase())
const routeTitle = computed(() => {
  const title = route.meta.title as string | undefined
  return title && te(title) ? t(title) : (title ?? t('nav.dashboard'))
})
useHead({ title: routeTitle })

const isManager = computed(() => user.value?.role === 'manager')

const { logout } = useLogout()

async function handleLogout() {
  await logout()
}

const navigation = computed<NavigationMenuItem[]>(() => [
  {
    label: t('nav.dashboard'),
    icon: 'i-lucide-layout-dashboard',
    to: '/',
  },
  {
    label: t('nav.routines'),
    icon: 'i-lucide-clipboard-list',
    to: '/routines',
  },
  {
    label: t('nav.catalog'),
    icon: 'i-lucide-book-open',
    defaultOpen: true,
    children: [
      {
        label: t('nav.exercises'),
        to: '/exercises',
      },
      {
        label: t('nav.muscleGroups'),
        to: '/muscle-groups',
      },
      {
        label: t('nav.equipment'),
        to: '/equipment',
      },
    ],
  },
  {
    label: t('nav.users'),
    icon: 'i-lucide-users',
    defaultOpen: true,
    children: [
      {
        label: t('nav.clients'),
        to: '/clients',
      },
      ...(isManager.value
        ? [
            {
              label: t('nav.trainers'),
              to: '/trainers',
            },
          ]
        : []),
    ],
  },
])
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible>
      <template #header="{ collapsed }">
        <span
          v-if="!collapsed"
          class="font-logo text-primary text-lg font-bold tracking-wide uppercase"
          >Macros for progress</span
        >
        <span v-else class="font-logo text-primary mx-auto text-lg font-bold">M4P</span>
        <UDashboardSidebarCollapse />
      </template>

      <UNavigationMenu :items="navigation" orientation="vertical" />

      <template #footer="{ collapsed }">
        <div v-if="!collapsed" class="flex w-full items-center gap-2">
          <UAvatar :text="avatarText" size="sm" />
          <span class="text-muted flex-1 truncate text-sm">{{ user?.email }}</span>
          <UButton
            icon="i-lucide-log-out"
            variant="ghost"
            class="cursor-pointer"
            size="xs"
            color="neutral"
            @click="handleLogout"
          />
        </div>
        <div v-else class="flex justify-center">
          <UAvatar :text="avatarText" size="sm" />
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar :title="routeTitle">
          <template #right>
            <LanguageSwitcher />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
