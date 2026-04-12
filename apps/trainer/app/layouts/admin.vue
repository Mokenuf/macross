<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const user = useSupabaseUser()

const avatarText = computed(() => user?.value?.email?.charAt(0).toUpperCase())
const routeTitle = computed(() => (route.meta.title as string) || 'Dashboard')

const { logout } = useLogout()

async function handleLogout() {
  await logout()
}

const navigation: NavigationMenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/',
  },
  {
    label: 'Ejercicios',
    icon: 'i-lucide-dumbbell',
    to: '/exercises',
  },
  {
    label: 'Grupos Musculares',
    icon: 'i-lucide-biceps-flexed',
    to: '/muscle-groups',
  },
  {
    label: 'Clientes',
    icon: 'i-lucide-users',
    to: '/clients',
  },
  {
    label: 'Rutinas',
    icon: 'i-lucide-clipboard-list',
    to: '/routines',
  },
]
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
        <span v-else class="text-lg font-bold font-logo text-primary mx-auto">M4P</span>
        <UDashboardSidebarCollapse />
      </template>

      <UNavigationMenu :items="navigation" orientation="vertical" />

      <template #footer="{ collapsed }">
        <div v-if="!collapsed" class="flex items-center gap-2 w-full">
          <UAvatar :text="avatarText" size="sm" />
          <span class="text-sm text-muted truncate flex-1">{{ user?.email }}</span>
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
        <UDashboardNavbar :title="routeTitle" />
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
