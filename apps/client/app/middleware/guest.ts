export default defineNuxtRouteMiddleware(_to => {
  const user = useSupabaseUser()

  if (user.value) {
    return navigateTo('/')
  }
})
