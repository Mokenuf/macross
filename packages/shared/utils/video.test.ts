import { describe, expect, it } from 'vitest'

import { toVideoEmbed } from './video'

describe('toVideoEmbed', () => {
  it('un video común se embebe horizontal y sin loop', () => {
    expect(toVideoEmbed('https://www.youtube.com/watch?v=abc123')).toEqual({
      src: 'https://www.youtube.com/embed/abc123',
      vertical: false,
    })
  })

  it('acepta el link corto de youtu.be', () => {
    expect(toVideoEmbed('https://youtu.be/abc123?si=xyz')?.src).toBe(
      'https://www.youtube.com/embed/abc123',
    )
  })

  it('un Short es vertical, en loop y muteado', () => {
    const embed = toVideoEmbed('https://youtube.com/shorts/abc123?feature=share')
    const params = new URL(embed?.src ?? '').searchParams

    expect(embed?.vertical).toBe(true)
    expect(embed?.src.startsWith('https://www.youtube.com/embed/abc123?')).toBe(true)
    expect(params.get('loop')).toBe('1')
    expect(params.get('playlist')).toBe('abc123')
    expect(params.get('mute')).toBe('1')
    expect(params.get('autoplay')).toBe('1')
    expect(params.get('playsinline')).toBe('1')
  })

  it('rechaza dominios que no son de YouTube', () => {
    expect(toVideoEmbed('https://vimeo.com/123')).toBeNull()
    expect(toVideoEmbed('https://notyoutube.com/watch?v=abc123')).toBeNull()
  })

  it('rechaza una URL inválida o vacía', () => {
    expect(toVideoEmbed('no es una url')).toBeNull()
    expect(toVideoEmbed(null)).toBeNull()
  })

  it('rechaza un link de YouTube sin id', () => {
    expect(toVideoEmbed('https://www.youtube.com/')).toBeNull()
  })
})
