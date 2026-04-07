import type {
  BaseResponse,
  Exercise,
  ExerciseSortOptions,
  OrderOptions,
  Pagination,
} from '@macross/shared'

export function useGetExercises() {
  const page = useQueryState('page', 1)
  const limit = useQueryState('limit', 20)
  const search = useQueryState('search', '')
  const sort = useQueryState<ExerciseSortOptions>('sort', 'createdAt')
  const order = useQueryState<OrderOptions>('order', 'desc')

  const { data, pending, refresh, error } = useFetch<BaseResponse<Exercise>>('/api/exercises', {
    key: 'exercises',
    query: { page, limit, search, sort, order },
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
