import type {
  BaseResponse,
  Exercise,
  ExerciseSortOptions,
  OrderOptions,
  Pagination,
} from '@macross/shared'

export function useGetExercises() {
  const page = ref(1)
  const limit = ref(20)
  const search = ref('')
  const sort = ref<ExerciseSortOptions>('createdAt')
  const order = ref<OrderOptions>('desc')

  const debouncedSearch = refDebounced(search, 300)

  const { data, pending, refresh, error } = useFetch<BaseResponse<Exercise>>('/api/exercises', {
    query: { page, limit, search: debouncedSearch, sort, order },
  })

  const exercises = computed<Exercise[]>(() => data.value?.rows ?? [])
  const pagination = computed<Pagination>(
    () => data.value?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 },
  )

  return {
    exercises,
    pagination,
    loading: pending,
    refresh,
    error,
    page,
    limit,
    search,
    sort,
    order,
  }
}
