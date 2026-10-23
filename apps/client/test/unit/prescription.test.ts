import { describe, expect, it } from 'vitest'

import { formatAmount, formatSeconds, repsForSet } from '../../app/utils/prescription'

describe('formatSeconds', () => {
  it('debajo del minuto escribe segundos', () => {
    expect(formatSeconds(45)).toBe('45 s')
  })

  it('en minutos justos no arrastra los segundos', () => {
    expect(formatSeconds(120)).toBe('2 min')
  })

  it('combina minutos y segundos', () => {
    expect(formatSeconds(90)).toBe('1 min 30 s')
  })
})

describe('formatAmount', () => {
  it('nombra la unidad de conteo en minúscula', () => {
    expect(formatAmount('20', 'Pasos', 'count')).toBe('20 pasos')
    expect(formatAmount('10', 'Repeticiones', 'count')).toBe('10 repeticiones')
  })

  it('conserva los rangos y combinaciones de texto libre', () => {
    expect(formatAmount('6-8', 'Repeticiones', 'count')).toBe('6-8 repeticiones')
    expect(formatAmount('12 + 20', 'Repeticiones', 'count')).toBe('12 + 20 repeticiones')
  })

  it('sin un número que medir no agrega unidad', () => {
    expect(formatAmount('al fallo', 'Repeticiones', 'count')).toBe('al fallo')
    expect(formatAmount('al fallo', 'Segundos', 'time')).toBe('al fallo')
  })

  it('una unidad de tiempo se escribe en segundos, sin importar el nombre', () => {
    expect(formatAmount('45', 'Tiempo', 'time')).toBe('45 s')
    expect(formatAmount('90', 'Segundos', 'time')).toBe('1 min 30 s')
  })

  it('un valor de tiempo no numérico conserva el texto y marca los segundos', () => {
    expect(formatAmount('30-45', 'Segundos', 'time')).toBe('30-45 s')
  })

  it('ignora espacios alrededor del valor', () => {
    expect(formatAmount(' 20 ', 'Pasos', 'count')).toBe('20 pasos')
  })
})

describe('repsForSet', () => {
  it('con cantidad por serie, cada serie tiene la suya', () => {
    const scheme = { reps: '16/12/9/6', setReps: ['16', '12', '9', '6'] }

    expect(repsForSet(scheme, 1)).toBe('16')
    expect(repsForSet(scheme, 3)).toBe('9')
  })

  it('sin cantidad por serie, todas usan la misma', () => {
    expect(repsForSet({ reps: '12', setReps: null }, 3)).toBe('12')
  })

  it('una serie sin cantidad propia cae a la de la celda', () => {
    expect(repsForSet({ reps: '16/12', setReps: ['16', '12'] }, 3)).toBe('16/12')
  })
})
