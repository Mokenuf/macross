import { serverSupabaseClient } from '#supabase/server'

type ServerEvent = Parameters<typeof serverSupabaseClient>[0]

// Nunca quedarse sin default: si marcar la nueva falla, se restaura la anterior.
export async function setDefaultUnit(event: ServerEvent, unitId: string) {
  const client = await serverSupabaseClient(event)

  const { data: previous, error: clearError } = await client
    .from('units')
    .update({ is_default: false })
    .eq('is_default', true)
    .is('deleted_at', null)
    .neq('id', unitId)
    .select('id')

  if (clearError) throw createError({ statusCode: 500, statusMessage: clearError.message })

  const { error } = await client.from('units').update({ is_default: true }).eq('id', unitId)

  if (error) {
    const previousIds = (previous ?? []).map(row => row.id)
    if (previousIds.length)
      await client.from('units').update({ is_default: true }).in('id', previousIds)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}
