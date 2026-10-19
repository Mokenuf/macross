import {
  defaultPagination,
  type ApiError,
  type BaseResponse,
  type CreateUnit,
  type Pagination,
  type Unit,
  type UnitFilters,
  type UpdateUnit,
} from '@macross/shared'
import type { FetchError } from 'ofetch'

export function useGetUnitList() {
  const filters = useQueryFilters<UnitFilters>({
    page: 1,
    limit: 20,
    search: '',
    sort: 'createdAt',
    order: 'desc',
  })

  const { data, pending, refresh, error } = useFetch<BaseResponse<Unit>>('/api/units', {
    key: 'units',
    query: filters,
  })

  const units = computed<Unit[]>(() => data.value?.rows ?? [])
  const pagination = computed<Pagination>(() => data.value?.pagination ?? defaultPagination)
  const counts = computed(() => data.value?.counts)

  return {
    units,
    pagination,
    counts,
    loading: pending,
    refresh,
    error,
    ...filters,
  }
}

export function useGetUnit(slug: string) {
  const { data, pending, refresh, error } = useFetch<Unit>(`/api/units/${slug}`, {
    key: `unit-${slug}`,
  })

  return { unit: data, loading: pending, refresh, error }
}

export function useCreateUnit() {
  const { t } = useI18n()
  const pending = ref(false)
  const toast = useToast()

  async function create(input: CreateUnit) {
    pending.value = true
    try {
      await $fetch('/api/units', { method: 'POST', body: input })
      await refreshNuxtData('units')
      await navigateTo('/units')
      toast.add({ title: t('units.toasts.created'), color: 'success' })
    } catch (e) {
      toast.add({
        title: 'Error',
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('units.toasts.createError'),
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }

  return { create, pending }
}

export function useUpdateUnit() {
  const { t } = useI18n()
  const pending = ref(false)
  const toast = useToast()

  async function update(slug: string, input: UpdateUnit) {
    pending.value = true
    try {
      await $fetch(`/api/units/${slug}`, { method: 'PATCH', body: input })
      await refreshNuxtData('units')
      await navigateTo('/units')
      toast.add({ title: t('units.toasts.updated'), color: 'success' })
    } catch (e) {
      toast.add({
        title: 'Error',
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('units.toasts.updateError'),
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }
  return { update, pending }
}

export function useDeleteUnit() {
  const { t } = useI18n()
  const pending = ref(false)
  const toast = useToast()

  async function remove(slug: string) {
    pending.value = true
    try {
      await $fetch(`/api/units/${slug}`, { method: 'DELETE' })
      await refreshNuxtData('units')
      toast.add({ title: t('units.toasts.deleted'), color: 'success' })
    } catch (e) {
      toast.add({
        title: 'Error',
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('units.toasts.deleteError'),
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }
  return { remove, pending }
}
