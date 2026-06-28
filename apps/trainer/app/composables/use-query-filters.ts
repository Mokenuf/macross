export function useQueryFilters<T extends Record<string, string | number | string[]>>(defaults: T) {
  const entries = Object.entries(defaults).map(
    ([key, value]) => [key, useQueryState(key, value)] as const,
  )
  return Object.fromEntries(entries) as {
    [K in keyof T]: WritableComputedRef<T[K]>
  }
}
