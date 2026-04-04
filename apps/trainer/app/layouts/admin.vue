<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const user = useSupabaseUser()

const avatarText = computed(() => user?.value?.email?.charAt(0).toUpperCase())
const routeTitle = computed(() => (route.meta.title as string) || 'Dashboard')

async function handleLogout() {
  const client = useSupabaseClient()
  await client.auth.signOut()
  await navigateTo('/auth/login')
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
        <span v-if="!collapsed" class="text-lg font-bold tracking-widest text-red-500 uppercase"
          >Macross</span
        >
        <span v-else class="text-lg font-bold text-red-500 mx-auto">M</span>
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
