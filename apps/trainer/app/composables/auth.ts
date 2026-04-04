import type { Login } from '@macross/shared'

export function useAuth() {
  async function login(input: Login) {
    await $fetch('/api/auth/login', { method: 'POST', body: input })

    await navigateTo('/', { external: true })
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })

    await navigateTo('/auth/login')
  }

  return { login, logout }
}
