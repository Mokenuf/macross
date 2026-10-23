export interface VideoEmbed {
  src: string
  vertical: boolean
}

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'])

// Un Short es una demo vertical de pocos segundos: va en loop, muteado y sin controles.
export function toVideoEmbed(videoUrl: string | null | undefined): VideoEmbed | null {
  if (!videoUrl) return null

  let url: URL
  try {
    url = new URL(videoUrl)
  } catch {
    return null
  }
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null

  const [kind, pathId] = url.pathname.split('/').filter(Boolean)
  const vertical = kind === 'shorts'
  const id = url.searchParams.get('v') ?? (url.hostname === 'youtu.be' ? kind : pathId)
  if (!id) return null

  if (!vertical) return { src: `https://www.youtube.com/embed/${id}`, vertical }

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: id,
    playsinline: '1',
    controls: '0',
    rel: '0',
  })
  return { src: `https://www.youtube.com/embed/${id}?${params}`, vertical }
}
