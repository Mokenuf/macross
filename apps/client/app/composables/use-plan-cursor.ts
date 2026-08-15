export function usePlanCursor() {
  const { routine } = useGetActiveRoutine()

  // Override de sesión: sin salida manual, abandonar un día a mitad clava la fase en esa semana.
  const override = useState<number | null>('plan-week', () => null)

  const cursor = computed(() => findPlanCursor(routine.value))

  const isPhaseDone = computed(() => !!routine.value?.days?.length && cursor.value === null)

  const currentWeek = computed(() => cursor.value?.week ?? routine.value?.weeks ?? 1)

  const week = computed(() => {
    const weeks = routine.value?.weeks ?? 1
    const chosen = override.value
    if (chosen !== null && chosen >= 1 && chosen <= weeks) return chosen
    return currentWeek.value
  })

  const suggestedDay = computed(
    () => routine.value?.days?.find(day => !isDayDone(day, week.value)) ?? null,
  )

  function setWeek(value: number) {
    override.value = value
  }

  return { currentWeek, isPhaseDone, setWeek, suggestedDay, week }
}
