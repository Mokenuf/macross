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

  it('acepta los campos de entrenamiento validos', () => {
    const result = updateClientSchema.safeParse({
      fullName: 'Fran Racciatti',
      birthDate: '1995-03-15',
      weightKg: 72.5,
      heightCm: 178,
      level: 'intermediate',
      goal: ['hypertrophy', 'strength'],
      desiredWeeklyFrequency: 4,
      injuries: 'Dolor lumbar',
    })
    expect(result.success).toBe(true)
  })

  it('convierte level "" a undefined via preprocess', () => {
    const result = updateClientSchema.safeParse({ fullName: 'Fran', level: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.level).toBeUndefined()
    }
  })

  it('acepta goal como array de multiples objetivos', () => {
    const result = updateClientSchema.safeParse({
      fullName: 'Fran',
      goal: ['hypertrophy', 'fat_loss'],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.goal).toEqual(['hypertrophy', 'fat_loss'])
    }
  })

  it('rechaza level fuera del enum', () => {
    const result = updateClientSchema.safeParse({ fullName: 'Fran', level: 'experto' })
    expect(result.success).toBe(false)
  })

  it('rechaza goal con un valor fuera del enum', () => {
    const result = updateClientSchema.safeParse({ fullName: 'Fran', goal: ['volumen'] })
    expect(result.success).toBe(false)
  })

  it('rechaza goal si no es un array', () => {
    const result = updateClientSchema.safeParse({ fullName: 'Fran', goal: 'hypertrophy' })
    expect(result.success).toBe(false)
  })

  it('coerciona weightKg y heightCm de string a number', () => {
    const result = updateClientSchema.safeParse({
      fullName: 'Fran',
      weightKg: '72.5',
      heightCm: '178',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.weightKg).toBe(72.5)
      expect(result.data.heightCm).toBe(178)
    }
  })

  it('rechaza weightKg negativo o cero', () => {
    expect(updateClientSchema.safeParse({ fullName: 'Fran', weightKg: -5 }).success).toBe(false)
    expect(updateClientSchema.safeParse({ fullName: 'Fran', weightKg: 0 }).success).toBe(false)
  })

  it('coerciona desiredWeeklyFrequency de string a number', () => {
    const result = updateClientSchema.safeParse({ fullName: 'Fran', desiredWeeklyFrequency: '4' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.desiredWeeklyFrequency).toBe(4)
    }
  })

  it('rechaza desiredWeeklyFrequency fuera del rango 1-7', () => {
    expect(
      updateClientSchema.safeParse({ fullName: 'Fran', desiredWeeklyFrequency: 0 }).success,
    ).toBe(false)
    expect(
      updateClientSchema.safeParse({ fullName: 'Fran', desiredWeeklyFrequency: 8 }).success,
    ).toBe(false)
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

  it('aplica status=active por default', () => {
    const result = clientQueryParamsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('active')
    }
  })

  it('acepta los valores validos de status', () => {
    expect(clientQueryParamsSchema.safeParse({ status: 'all' }).success).toBe(true)
    expect(clientQueryParamsSchema.safeParse({ status: 'active' }).success).toBe(true)
    expect(clientQueryParamsSchema.safeParse({ status: 'deleted' }).success).toBe(true)
  })

  it('rechaza status fuera del enum', () => {
    const result = clientQueryParamsSchema.safeParse({ status: 'archived' })
    expect(result.success).toBe(false)
  })
})
