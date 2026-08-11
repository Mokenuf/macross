<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const { data: user, error } = useGetMe()

const { t, te } = useI18n()

const { logout } = useLogout()

const supabase = useSupabaseClient()

const toast = useToast()

const avatarText = computed(() => {
  const name = user.value?.fullName ?? user.value?.email ?? ''
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
})
const isManager = computed(() => user.value?.role === 'manager')
const routeTitle = computed(() => {
  const title = route.meta.title as string | undefined
  return title && te(title) ? t(title) : (title ?? t('nav.dashboard'))
})

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
    type: 'label',
  },
  {
    label: t('nav.exercises'),
    icon: 'i-lucide-dumbbell',
    to: '/exercises',
  },
  {
    label: t('nav.muscleGroups'),
    icon: 'i-lucide-person-standing',
    to: '/muscle-groups',
  },
  {
    label: t('nav.equipment'),
    icon: 'i-lucide-wrench',
    to: '/equipment',
  },
  {
    label: t('nav.users'),
    type: 'label',
  },
  {
    label: t('nav.clients'),
    icon: 'i-lucide-users',
    to: '/clients',
  },
  ...(isManager.value
    ? [
        {
          label: t('nav.trainers'),
          icon: 'i-lucide-user-cog',
          to: '/trainers',
        },
      ]
    : []),
])

const collapsedNavigation = computed<NavigationMenuItem[]>(
  () =>
    navigation.value.map(item =>
      item.type === 'label' ? { type: 'separator' } : item,
    ) as NavigationMenuItem[],
)

// `immediate` porque el error llega ya seteado desde SSR/payload: no hay cambio que observar.
watch(
  error,
  async err => {
    if (!import.meta.client) return
    if (err?.statusCode !== 401 && err?.statusCode !== 403) return

    // Soltar la sesión y no solo navegar: `guest` rebota a `/` a cualquiera con sesión viva.
    await supabase.auth.signOut()
    toast.add({
      title: t('auth.toasts.sessionRevoked.title'),
      description: t('auth.toasts.sessionRevoked.description'),
      color: 'error',
    })
    await navigateTo('/auth/login', { external: true })
  },
  { immediate: true },
)

useHead({ title: routeTitle })

async function handleLogout() {
  await logout()
}
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible :ui="{ root: 'transition-[width] duration-200 ease-out' }">
      <template #header="{ collapsed, collapse }">
        <div
          class="flex w-full pt-3"
          :class="collapsed ? 'flex-col items-center gap-2' : 'items-start justify-between'"
        >
          <NuxtLink
            v-if="!collapsed"
            to="/"
            class="font-logo pt-1 pb-4 text-xl leading-tight tracking-wider uppercase"
          >
            Macros<span class="text-primary"> for Progress</span>
          </NuxtLink>
          <NuxtLink v-else to="/" class="font-logo text-2xl leading-none tracking-wider uppercase">
            M<span class="text-primary">4</span>P
          </NuxtLink>
          <UButton
            :icon="collapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-left'"
            color="neutral"
            variant="ghost"
            size="sm"
            square
            class="text-dimmed hover:text-default"
            @click="collapse(!collapsed)"
          />
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="collapsed ? collapsedNavigation : navigation"
          orientation="vertical"
          :ui="{
            label:
              'text-[10px] font-semibold uppercase tracking-[0.14em] text-dimmed px-2.5 pt-3.5 pb-1.5',
            link: 'gap-2.5 py-2 text-sm before:rounded-sm',
          }"
        />
      </template>

      <template #footer="{ collapsed }">
        <div v-if="!collapsed" class="flex w-full flex-col gap-2">
          <div class="flex items-center gap-2.5">
            <BasePerson
              :name="user?.fullName ?? ''"
              :avatar-url="user?.avatarUrl"
              class="min-w-0 flex-1"
            >
              <template #subtitle>
                <p class="text-dimmed text-[10px] font-medium tracking-wider uppercase">
                  {{ user?.role }}
                </p>
              </template>
            </BasePerson>
            <UButton
              icon="i-lucide-log-out"
              color="neutral"
              variant="ghost"
              square
              size="xs"
              class="border-default text-muted hover:border-error/40 hover:bg-error/8 hover:text-error rounded-sm border p-1.5"
              @click="handleLogout"
            />
          </div>
          <LanguageSwitcher />
        </div>
        <div v-else class="flex flex-col items-center gap-2">
          <UAvatar
            :src="user?.avatarUrl || undefined"
            :text="avatarText"
            class="from-macross-primary-500 to-macross-gray-800 size-7.5 bg-linear-to-br"
            :ui="{ fallback: 'font-logo text-sm text-highlighted' }"
          />
          <LanguageSwitcher compact />
          <UButton
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            square
            size="xs"
            class="border-default text-muted hover:border-error/40 hover:bg-error/8 hover:text-error rounded-sm border p-1.5"
            @click="handleLogout"
          />
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
