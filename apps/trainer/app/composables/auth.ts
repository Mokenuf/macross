import type { ApiError, Login, SetPassword } from '@macross/shared'
import type { FetchError } from 'ofetch'

export function useLogin() {
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

  return { login }
}

export function useLogout() {
  const toast = useToast()

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    toast.add({ title: 'Adios', color: 'success' })
    await navigateTo('/auth/login', { external: true })
  }

  return { logout }
}

export function useSetPassword() {
  const toast = useToast()

  async function setPassword(input: SetPassword) {
    try {
      await $fetch('/api/auth/set-password', { method: 'POST', body: input })
      toast.add({ title: 'Contraseña actualizada', color: 'success' })
      await navigateTo('/', { external: true })
    } catch (e) {
      toast.add({
        title: 'Error',
        description: (e as FetchError<ApiError>).data?.statusMessage ?? 'Algo salió mal',
        color: 'error',
      })
    }
  }

  return { setPassword }
}
