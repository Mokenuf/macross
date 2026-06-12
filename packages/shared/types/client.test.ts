import { describe, expect, it } from 'vitest'

import { clientQueryParamsSchema, createClientSchema, updateClientSchema } from './client'

const VALID_UUID = '4137240f-eace-4203-9288-8149ce71bd3a'

describe('createClientSchema', () => {
  it('acepta un cliente valido', () => {
    const result = createClientSchema.safeParse({
      fullName: 'Fran Racciatti',
      email: 'fran@macross.com',
      phone: '+5491112345678',
      trainerId: VALID_UUID,
    })
    expect(result.success).toBe(true)
  })

  it('acepta sin phone (es optional)', () => {
    const result = createClientSchema.safeParse({
      fullName: 'Fran Racciatti',
      email: 'fran@macross.com',
    })
    expect(result.success).toBe(true)
  })

  it('acepta sin trainerId (es optional, el server lo resuelve)', () => {
    const result = createClientSchema.safeParse({
      fullName: 'Fran Racciatti',
      email: 'fran@macross.com',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza trainerId que no es uuid', () => {
    const result = createClientSchema.safeParse({
      fullName: 'Fran Racciatti',
      email: 'fran@macross.com',
      trainerId: 'no-es-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza si falta el fullName', () => {
    const result = createClientSchema.safeParse({ email: 'fran@macross.com' })
    expect(result.success).toBe(false)
  })

  it('rechaza si fullName es string vacio', () => {
    const result = createClientSchema.safeParse({
      fullName: '',
      email: 'fran@macross.com',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza si falta el email', () => {
    const result = createClientSchema.safeParse({ fullName: 'Fran Racciatti' })
    expect(result.success).toBe(false)
  })

  it('rechaza email invalido', () => {
    const result = createClientSchema.safeParse({
      fullName: 'Fran Racciatti',
      email: 'no-es-un-email',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza email string vacio', () => {
    const result = createClientSchema.safeParse({
      fullName: 'Fran Racciatti',
      email: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateClientSchema', () => {
  it('acepta un update valido con avatarUrl', () => {
    const result = updateClientSchema.safeParse({
      fullName: 'Fran Racciatti',
      phone: '+5491112345678',
      avatarUrl: 'https://cdn.macross.com/avatar.png',
    })
    expect(result.success).toBe(true)
  })

  it('no incluye email (fue omitido)', () => {
    const result = updateClientSchema.safeParse({
      fullName: 'Fran Racciatti',
      email: 'fran@macross.com',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect('email' in result.data).toBe(false)
    }
  })

  it('conserva trainerId (reasignacion por manager)', () => {
    const result = updateClientSchema.safeParse({
      fullName: 'Fran Racciatti',
      trainerId: VALID_UUID,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.trainerId).toBe(VALID_UUID)
    }
  })

  it('convierte avatarUrl "" a undefined via preprocess', () => {
    const result = updateClientSchema.safeParse({
      fullName: 'Fran Racciatti',
      avatarUrl: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.avatarUrl).toBeUndefined()
    }
  })

  it('rechaza avatarUrl invalido', () => {
    const result = updateClientSchema.safeParse({
      fullName: 'Fran Racciatti',
      avatarUrl: 'no-es-una-url',
    })
    expect(result.success).toBe(false)
  })
})

describe('clientQueryParamsSchema', () => {
  it('aplica sort=createdAt por default', () => {
    const result = clientQueryParamsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sort).toBe('createdAt')
    }
  })

  it('acepta los valores validos de sort', () => {
    expect(clientQueryParamsSchema.safeParse({ sort: 'fullName' }).success).toBe(true)
    expect(clientQueryParamsSchema.safeParse({ sort: 'createdAt' }).success).toBe(true)
  })

  it('rechaza sort fuera del enum', () => {
    const result = clientQueryParamsSchema.safeParse({ sort: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('convierte trainerId "" a undefined via preprocess', () => {
    const result = clientQueryParamsSchema.safeParse({ trainerId: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.trainerId).toBeUndefined()
    }
  })

  it('acepta trainerId uuid valido', () => {
    const result = clientQueryParamsSchema.safeParse({ trainerId: VALID_UUID })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.trainerId).toBe(VALID_UUID)
    }
  })

  it('rechaza trainerId que no es uuid', () => {
    const result = clientQueryParamsSchema.safeParse({ trainerId: 'no-es-uuid' })
    expect(result.success).toBe(false)
  })

  it('permite omitir trainerId (es optional)', () => {
    const result = clientQueryParamsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.trainerId).toBeUndefined()
    }
  })

  it('hereda la coercion de page y limit del schema base', () => {
    const result = clientQueryParamsSchema.safeParse({ page: '2', limit: '50' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.limit).toBe(50)
    }
  })
})
