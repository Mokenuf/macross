import type { ApiError, Login } from '@macross/shared'
import type { FetchError } from 'ofetch'

export function useAuth() {
  const toast = useToast()

  async function login(input: Login) {
    try {
      await $fetch('/api/auth/login', { method: 'POST', body: input })
      toast.add({ title: 'Bienvenido', color: 'success' })
      await navigateTo('/', { external: true })
    } catch (e) {
      toast.add({
        title: 'Error',
        description: (e as FetchError<ApiError>).data?.statusMessage ?? 'Algo salió mal',
        color: 'error',
      })
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    toast.add({ title: 'Adios', color: 'success' })
    await navigateTo('/auth/login')
  }

  return { login, logout }
}
