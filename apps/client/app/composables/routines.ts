import type { Routine } from '@macross/shared'

export function useGetActiveRoutine() {
  // deep: true porque el registro de series parchea el árbol en memoria y el default de Nuxt 4 es
  // shallowRef, con el que esa mutación no re-renderiza.
  const { data, pending, refresh, error } = useFetch<Routine | null>('/api/plan', {
    key: 'plan',
    deep: true,
  })

  return {
    routine: data,
    loading: pending,
    refresh,
    error,
  }
}
