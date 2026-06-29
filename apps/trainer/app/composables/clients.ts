import {
  defaultPagination,
  type ClientFilters,
  type ApiError,
  type BaseResponse,
  type Client,
  type CreateClient,
  type Pagination,
  type UpdateClient,
} from '@macross/shared'
import type { FetchError } from 'ofetch'

export function useGetClientList() {
  const filters = useQueryFilters<ClientFilters>({
    page: 1,
    limit: 20,
    search: '',
    trainerId: '',
    sort: 'createdAt',
    order: 'desc',
    status: 'active',
  })

  const { data, pending, refresh, error } = useFetch<BaseResponse<Client>>('/api/clients', {
    key: 'clients',
    query: filters,
  })

  const clients = computed<Client[]>(() => data.value?.rows ?? [])
  const pagination = computed<Pagination>(() => data.value?.pagination ?? defaultPagination)

  return {
    clients,
    pagination,
    loading: pending,
    refresh,
    error,
    ...filters,
  }
}

export function useGetClient(nanoId: string) {
  const { data, pending, refresh, error } = useFetch<Client>(`/api/clients/${nanoId}`, {
    key: `client-${nanoId}`,
  })

  return { client: data, loading: pending, refresh, error }
}

export function useCreateClient() {
  const pending = ref(false)
  const toast = useToast()

  async function create(input: CreateClient) {
    pending.value = true
    try {
      await $fetch('/api/clients', { method: 'POST', body: input })
      await refreshNuxtData('clients')
      await navigateTo('/clients')
      toast.add({
        title: 'Cliente invitado',
        description: `Mail enviado a ${input.email}`,
        color: 'success',
      })
    } catch (e) {
      toast.add({
        title: 'Error',
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? 'No se pudo invitar al cliente',
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }

  return { create, pending }
}

export function useUpdateClient() {
  const pending = ref(false)
  const toast = useToast()

  async function update(nanoId: string, input: UpdateClient) {
    pending.value = true
    try {
      await $fetch(`/api/clients/${nanoId}`, { method: 'PATCH', body: input })
      await refreshNuxtData('clients')
      navigateTo('/clients')
      toast.add({ title: 'Cliente actualizado', color: 'success' })
    } catch (e) {
      toast.add({
        title: 'Error',
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? 'No se pudo actualizar el cliente',
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }

  return { update, pending }
}

export function useDeleteClient() {
  const pending = ref(false)
  const toast = useToast()

  async function remove(nanoId: string) {
    pending.value = true
    try {
      await $fetch(`/api/clients/${nanoId}`, { method: 'DELETE' })
      await refreshNuxtData('clients')
      toast.add({ title: 'Cliente eliminado', color: 'success' })
    } catch (e) {
      toast.add({
        title: 'Error',
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? 'No se pudo eliminar el cliente',
        color: 'error',
      })
    } finally {
      pending.value = false
    }
  }

  return { remove, pending }
}

export function useReactivateClient() {
  const pending = ref(false)
  const toast = useToast()

  async function reactivate(nanoId: string) {
    pending.value = true
    try {
      await $fetch(`/api/clients/${nanoId}/reactivate`, { method: 'POST' })
      await refreshNuxtData('clients')
      toast.add({ title: 'Cliente reactivado', color: 'success' })
    } catch (e) {
      toast.add({
        title: 'Error',
        description:
          (e as FetchError<ApiError>).data?.statusMessage ?? 'No se pudo reactivar el cliente',
      })
    } finally {
      pending.value = false
    }
  }

  return { reactivate, pending }
}
