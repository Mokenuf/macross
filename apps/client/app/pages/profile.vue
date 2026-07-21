<script setup lang="ts">
import type { ClientGoal, ClientLevel } from '@macross/shared'
import { differenceInYears } from 'date-fns'

definePageMeta({
  middleware: 'auth',
  title: 'profile.title',
})

const { t, locale, locales, setLocale } = useI18n()
const { logout } = useLogout()
const { profile, loading } = useGetProfile()

useHead({ title: t('profile.title') })

const flags: Record<string, string> = {
  es: 'i-circle-flags-ar',
  en: 'i-circle-flags-us',
}

const levelLabels = computed<Record<ClientLevel, string>>(() => ({
  beginner: t('profile.levels.beginner'),
  intermediate: t('profile.levels.intermediate'),
  advanced: t('profile.levels.advanced'),
  athlete: t('profile.levels.athlete'),
}))

const goalLabels = computed<Record<ClientGoal, string>>(() => ({
  hypertrophy: t('profile.goals.hypertrophy'),
  strength: t('profile.goals.strength'),
  fat_loss: t('profile.goals.fat_loss'),
  health: t('profile.goals.health'),
}))

const initials = computed(() => {
  const name = profile.value?.fullName ?? ''
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
})

const age = computed(() =>
  profile.value?.birthDate
    ? differenceInYears(new Date(), new Date(profile.value.birthDate))
    : null,
)

const kpis = computed(() =>
  [
    { label: t('profile.kpi.age'), value: age.value, unit: t('profile.kpi.ageUnit') },
    {
      label: t('profile.kpi.weight'),
      value: profile.value?.weightKg ?? null,
      unit: t('profile.kpi.weightUnit'),
      accent: true,
    },
    {
      label: t('profile.kpi.height'),
      value: profile.value?.heightCm ?? null,
      unit: t('profile.kpi.heightUnit'),
    },
    {
      label: t('profile.kpi.frequency'),
      value: profile.value?.desiredWeeklyFrequency ?? null,
      unit: t('profile.kpi.frequencyUnit'),
    },
  ].filter(k => k.value !== null && k.value !== undefined),
)

const currentLocaleName = computed(() => locales.value.find(l => l.code === locale.value)?.name)

// Solo 2 idiomas (es/en): la fila entera togglea. Si algún día hay un 3ro, volver a un menú.
function toggleLanguage() {
  const next = locales.value.find(l => l.code !== locale.value)
  if (next) setLocale(next.code)
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="space-y-6">
      <div class="bg-muted h-16 animate-pulse rounded-md" />
      <div class="bg-muted h-28 animate-pulse rounded-md" />
      <div class="bg-muted h-40 animate-pulse rounded-md" />
    </div>

    <template v-else-if="profile">
      <header class="flex items-center gap-3.5">
        <span
          class="from-macross-gray-700 to-macross-gray-950 ring-accented text-macross-bronze-soft font-logo flex size-14 shrink-0 items-center justify-center rounded-md bg-linear-to-br text-2xl ring-1"
        >
          {{ initials }}
        </span>
        <div class="min-w-0">
          <p class="text-default truncate text-lg font-semibold">{{ profile.fullName }}</p>
          <p v-if="profile.trainer" class="text-dimmed text-sm">
            {{ t('profile.clientOf', { trainer: profile.trainer.fullName }) }}
          </p>
        </div>
      </header>

      <div v-if="kpis.length" class="grid grid-cols-2 gap-3">
        <div
          v-for="kpi in kpis"
          :key="kpi.label"
          class="bg-muted ring-accented rounded-md px-3.5 py-3 ring-1"
        >
          <p class="text-dimmed mb-1 text-[10px] font-semibold tracking-widest uppercase">
            {{ kpi.label }}
          </p>
          <p
            class="font-logo text-3xl leading-none"
            :class="kpi.accent && 'text-macross-bronze-soft'"
          >
            {{ kpi.value }}<span class="text-dimmed ml-1 text-sm">{{ kpi.unit }}</span>
          </p>
        </div>
      </div>

      <div v-if="profile.level || profile.goal?.length" class="flex flex-wrap gap-2">
        <UBadge
          v-if="profile.level"
          :label="levelLabels[profile.level]"
          color="neutral"
          variant="subtle"
        />
        <UBadge
          v-for="g in profile.goal"
          :key="g"
          :label="goalLabels[g]"
          color="primary"
          variant="subtle"
        />
      </div>

      <section>
        <p class="text-dimmed mb-1 text-[11px] font-semibold tracking-widest uppercase">
          {{ t('profile.account.title') }}
        </p>

        <NuxtLink
          to="/auth/change-password"
          class="border-default text-default hover:text-primary flex items-center gap-3 border-t py-3.5 text-sm transition-colors"
        >
          <UIcon name="i-lucide-lock" class="text-macross-bronze-soft size-4 shrink-0" />
          {{ t('profile.account.changePassword') }}
          <UIcon name="i-lucide-chevron-right" class="text-dimmed ml-auto size-4" />
        </NuxtLink>

        <button
          type="button"
          class="border-default text-default flex w-full items-center gap-3 border-t py-3.5 text-sm"
          @click="toggleLanguage"
        >
          <UIcon name="i-lucide-globe" class="text-macross-bronze-soft size-4 shrink-0" />
          {{ t('profile.account.language') }}
          <span class="text-muted ml-auto flex items-center gap-2">
            <UIcon :name="flags[locale]" class="size-4" />
            {{ currentLocaleName }}
            <UIcon name="i-lucide-arrow-right-left" class="text-dimmed size-4" />
          </span>
        </button>

        <button
          type="button"
          class="border-default text-error flex w-full items-center gap-3 border-t border-b py-3.5 text-sm"
          @click="logout"
        >
          <UIcon name="i-lucide-log-out" class="size-4 shrink-0" />
          {{ t('profile.account.logout') }}
        </button>
      </section>
    </template>
  </div>
</template>
