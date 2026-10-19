<script setup lang="ts">
import type { TimerKind } from '@/composables/use-workout-timer'

interface TimerOverlayProps {
  kind: TimerKind
  isFinalCountdown: boolean
  nextLabel: string
  nextName?: string
  nextDetail?: string
  progress: number
  remaining: number
}

const { kind, nextDetail, nextLabel, nextName, progress, remaining } =
  defineProps<TimerOverlayProps>()

interface TimerOverlayEmits {
  add: []
  skip: []
}

defineEmits<TimerOverlayEmits>()

const { t } = useI18n()

// Ceil para que arranque en su valor exacto y solo marque 0:00 al terminar de verdad.
const countdown = computed(() => {
  const seconds = Math.ceil(remaining / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
})

const dashOffset = computed(() => RING_CIRCUMFERENCE * progress)

const RING_CIRCUMFERENCE = 395.84
</script>

<template>
  <div
    class="bg-background fixed inset-0 z-50 flex flex-col px-5 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]"
  >
    <template v-if="kind === 'transition'">
      <div class="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p class="text-macross-primary-300 text-sm font-semibold tracking-[0.2em] uppercase">
          {{ t('plan.transition.title') }}
        </p>
        <p class="font-logo text-6xl leading-[0.9] tracking-wide uppercase">{{ nextName }}</p>
        <p v-if="nextDetail" class="text-muted text-sm">{{ nextDetail }}</p>
        <p
          :class="[
            'font-logo text-macross-gold mt-6 text-6xl tabular-nums',
            isFinalCountdown ? 'animate-countdown-beat' : '',
          ]"
        >
          {{ countdown }}
        </p>
      </div>

      <div class="flex justify-center">
        <UButton
          size="xl"
          color="primary"
          :label="t('plan.transition.go')"
          @click="$emit('skip')"
        />
      </div>
    </template>

    <template v-else>
      <p class="text-macross-primary-300 font-logo text-center text-5xl tracking-wide uppercase">
        {{ kind === 'work' ? t('plan.work.title') : t('plan.rest.title') }}
      </p>

      <div class="flex flex-1 flex-col justify-center">
        <div class="relative mx-auto aspect-square w-full max-w-64">
          <svg class="size-full -rotate-90" viewBox="0 0 144 144">
            <circle
              class="stroke-macross-gray-700"
              cx="72"
              cy="72"
              r="63"
              fill="none"
              stroke-width="9"
            />
            <circle
              class="stroke-macross-gold"
              cx="72"
              cy="72"
              r="63"
              fill="none"
              stroke-width="9"
              stroke-linecap="round"
              :stroke-dasharray="RING_CIRCUMFERENCE"
              :stroke-dashoffset="dashOffset"
            />
          </svg>
          <div class="absolute inset-0 grid place-items-center text-center">
            <div>
              <!-- tabular-nums: sin esto el contador salta de ancho a cada dígito. -->
              <p
                :class="[
                  'font-logo text-macross-gold text-8xl leading-[0.8] tabular-nums',
                  isFinalCountdown ? 'animate-countdown-beat' : '',
                ]"
              >
                {{ countdown }}
              </p>
              <p class="text-dimmed mt-1 text-xs tracking-[0.14em] uppercase">
                {{ t('plan.rest.remaining') }}
              </p>
            </div>
          </div>
        </div>

        <p v-if="kind === 'rest'" class="text-muted mt-10 text-center text-sm">
          {{ t('plan.rest.next') }}
          <span class="text-macross-primary-300 font-semibold">{{ nextLabel }}</span>
        </p>
      </div>

      <div v-if="kind === 'work'" class="flex justify-center">
        <UButton
          size="xl"
          color="neutral"
          variant="outline"
          :label="t('plan.work.finish')"
          @click="$emit('skip')"
        />
      </div>
      <div v-else class="flex justify-center gap-3">
        <UButton
          size="xl"
          color="neutral"
          variant="outline"
          :label="t('plan.rest.add')"
          @click="$emit('add')"
        />
        <UButton
          size="xl"
          color="neutral"
          variant="ghost"
          :label="t('plan.rest.skip')"
          @click="$emit('skip')"
        />
      </div>
    </template>
  </div>
</template>
