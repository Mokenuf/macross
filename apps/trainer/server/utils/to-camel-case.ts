export function toCamelCase<T = unknown>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map(item => toCamelCase(item)) as T
  }

  if (input !== null && typeof input === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(input)) {
      const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase())
      result[camelKey] = toCamelCase(value)
    }
    return result as T
  }

  return input as T
}
