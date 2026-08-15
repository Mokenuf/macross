type RestTimerState = { endsAt: number; totalMs: number } | null

export function useRestTimer() {
  const now = shallowRef(Date.now())
  const state = useState<RestTimerState>('rest-timer', () => null)
  const { vibrate } = useVibrate()
  const { release, request } = useWakeLock()

  const { pause, resume } = useIntervalFn(() => (now.value = Date.now()), TICK_MS, {
    immediate: false,
  })

  // Derivado de un timestamp y no decrementando: el browser congela el tick en background.
  const remaining = computed(() => (state.value ? Math.max(0, state.value.endsAt - now.value) : 0))
  const isRunning = computed(() => remaining.value > 0)
  const progress = computed(() => (state.value ? 1 - remaining.value / state.value.totalMs : 1))

  const isFinalCountdown = computed(
    () => remaining.value > 0 && remaining.value <= COUNTDOWN_OFFSETS.length * 1000,
  )

  watch(remaining, (value, previous) => {
    if (!state.value) return
    if (value === 0) return finish()

    // A diferencia de los tonos, la vibración no se puede agendar: depende del tick.
    if (isFinalCountdown.value && Math.ceil(value / 1000) !== Math.ceil(previous / 1000)) {
      vibrate(COUNTDOWN_VIBRATION)
    }
  })

  function start(seconds: number) {
    if (seconds <= 0) return

    now.value = Date.now()
    state.value = { endsAt: now.value + seconds * 1000, totalMs: seconds * 1000 }
    resume()
    // Con el device bloqueado iOS suspende el AudioContext y congela el tick.
    void request('screen')
    scheduleCues(seconds)
  }

  function add(seconds: number) {
    if (!state.value) return

    state.value = {
      endsAt: state.value.endsAt + seconds * 1000,
      totalMs: state.value.totalMs + seconds * 1000,
    }
    scheduleCues((state.value.endsAt - Date.now()) / 1000)
  }

  function skip() {
    cancelCues()
    stop()
  }

  // Los tonos no se cancelan: ya están agendados y suenan aunque el tick llegue tarde.
  function finish() {
    vibrate(FINAL_VIBRATION)
    stop()
  }

  function stop() {
    state.value = null
    pause()
    void release()
  }

  // El estado sobrevive en useState, pero el ticker y el wake lock mueren con la page.
  if (import.meta.client && state.value) {
    if (state.value.endsAt > Date.now()) {
      now.value = Date.now()
      resume()
      void request('screen')
    } else {
      state.value = null
    }
  }

  return { add, isFinalCountdown, isRunning, progress, remaining, skip, start }
}

// A nivel de módulo: el cliente puede irse del ejercicio mientras descansa y el aviso tiene que sonar igual.
let audio: { bus: DynamicsCompressorNode; context: AudioContext } | null = null
let scheduledTones: OscillatorNode[] = []

function audioBus() {
  if (!audio) {
    const context = new AudioContext()
    const bus = context.createDynamicsCompressor()
    bus.threshold.value = -14
    bus.ratio.value = 12
    bus.attack.value = 0.002
    bus.release.value = 0.1
    bus.connect(context.destination)
    audio = { bus, context }
  }

  // Sin este resume dentro del tap, en mobile el contexto queda suspended y no suena nunca.
  void audio.context.resume()

  return audio
}

function scheduleCues(seconds: number) {
  if (!import.meta.client) return

  cancelCues()
  const { bus, context } = audioBus()
  const endsAt = context.currentTime + seconds

  const cues = [
    ...COUNTDOWN_OFFSETS.map(offset => ({ offset, chord: COUNTDOWN_CHORD, seconds: 0.1 })),
    { offset: 0, chord: FINAL_CHORD, seconds: 0.45 },
  ]

  // El filtro cubre los descansos de menos de 3 s: un aviso en el pasado sonaría de golpe al arrancar.
  scheduledTones = cues
    .filter(cue => endsAt + cue.offset > context.currentTime)
    .flatMap(cue =>
      cue.chord.map(hz => schedulePulse(context, bus, endsAt + cue.offset, hz, cue.seconds)),
    )
}

function schedulePulse(
  context: AudioContext,
  bus: AudioNode,
  at: number,
  hz: number,
  seconds: number,
) {
  const gain = context.createGain()
  const oscillator = context.createOscillator()
  const endsAt = at + seconds

  oscillator.type = 'triangle'
  oscillator.frequency.value = hz
  oscillator.connect(gain).connect(bus)

  // Los 0.0001 son porque el ramp exponencial no puede salir de cero.
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(PEAK_GAIN, at + 0.004)
  gain.gain.setValueAtTime(PEAK_GAIN, endsAt - 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, endsAt)
  oscillator.start(at)
  oscillator.stop(endsAt)

  return oscillator
}

function cancelCues() {
  // stop() con un tiempo anterior al de arranque deja el nodo sin sonar nunca.
  for (const oscillator of scheduledTones) oscillator.stop()
  scheduledTones = []
}

const COUNTDOWN_CHORD = [1046, 2093]
const FINAL_CHORD = [1318, 2637, 3951]

const COUNTDOWN_OFFSETS = [-3, -2, -1]
const COUNTDOWN_VIBRATION = [70]
const FINAL_VIBRATION = [180, 90, 180]
const PEAK_GAIN = 0.4
const TICK_MS = 250
