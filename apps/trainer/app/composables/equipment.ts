import {
  defaultPagination,
  type ApiError,
  type BaseResponse,
  type CreateEquipment,
  type Equipment,
  type EquipmentFilters,
  type Pagination,
  type UpdateEquipment,
} from '@macross/shared'
import type { FetchError } from 'ofetch'

export function useGetEquipmentList() {
  const filters = useQueryFilters<EquipmentFilters>({
    page: 1,
    limit: 20,
    search: '',
    sort: 'createdAt',
    order: 'desc',
  })

  const { data, pending, refresh, error } = useFetch<BaseResponse<Equipment>>('/api/equipment', {
    key: 'equipment',
    query: filters,
  })

  const equipments = computed<Equipment[]>(() => data.value?.rows ?? [])
  const pagination = computed<Pagination>(() => data.value?.pagination ?? defaultPagination)
  const counts = computed(() => data.value?.counts)

  return {
    equipments,
    pagination,
    counts,
    loading: pending,
    refresh,
    error,
    ...filters,
  }
}

export function useGetEquipment(slug: string) {
  const { data, pending, refresh, error } = useFetch<Equipment>(`/api/equipment/${slug}`, {
    key: `equipment-${slug}`,
  })

  return { equipment: data, loading: pending, refresh, error }
}

export function useCreateEquipment() {
  const { t } = useI18n()
  const pending = ref(false)
  const toast = useToast()

  async function create(input: CreateEquipment) {
    pending.value = true
    try {
      await $fetch('/api/equipment', { method: 'POST', body: input })
      await refreshNuxtData('equipment')
      await navigateTo('/equipment')
      toast.add({ title: t('equipment.toasts.created'), color: 'success' })
    } catch (e) {
      toast.add({
        title: 'Error',
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('equipment.toasts.createError'),
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }

  return { create, pending }
}

export function useUpdateEquipment() {
  const { t } = useI18n()
  const pending = ref(false)
  const toast = useToast()

  async function update(slug: string, input: UpdateEquipment) {
    pending.value = true
    try {
      await $fetch(`/api/equipment/${slug}`, { method: 'PATCH', body: input })
      await refreshNuxtData('equipment')
      await navigateTo('/equipment')
      toast.add({ title: t('equipment.toasts.updated'), color: 'success' })
    } catch (e) {
      toast.add({
        title: 'Error',
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('equipment.toasts.updateError'),
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }
  return { update, pending }
}

export function useDeleteEquipment() {
  const { t } = useI18n()
  const pending = ref(false)
  const toast = useToast()

  async function remove(slug: string) {
    pending.value = true
    try {
      await $fetch(`/api/equipment/${slug}`, { method: 'DELETE' })
      await refreshNuxtData('equipment')
      toast.add({ title: t('equipment.toasts.deleted'), color: 'success' })
    } catch (e) {
      toast.add({
        title: 'Error',
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? t('equipment.toasts.deleteError'),
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }
  return { remove, pending }
}
