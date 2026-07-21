import type { Routine } from '@macross/shared'

export function useGetActiveRoutine() {
  const { data, pending, refresh, error } = useFetch<Routine | null>('/api/plan', {
    key: 'plan',
  })

  return {
    routine: data,
    loading: pending,
    refresh,
    error,
  }
}
