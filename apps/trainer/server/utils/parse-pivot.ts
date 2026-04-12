import { z } from 'zod'

export function parsePivot<TPivot, TFinal>(
  raw: unknown,
  pivotSchema: z.ZodType<TPivot>,
  finalSchema: z.ZodType<TFinal>,
  transform: (validated: TPivot) => unknown,
): TFinal {
  const validated = pivotSchema.parse(toCamelCase(raw))
  return finalSchema.parse(transform(validated))
}

export function parsePivotArray<TPivot, TFinal>(
  raw: unknown[],
  pivotSchema: z.ZodType<TPivot>,
  finalSchema: z.ZodType<TFinal>,
  transform: (validated: TPivot) => unknown,
): TFinal[] {
  const validated = z.array(pivotSchema).parse(toCamelCase(raw))
  return z.array(finalSchema).parse(validated.map(transform))
}
