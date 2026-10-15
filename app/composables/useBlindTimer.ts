import { computed, onBeforeUnmount, ref } from 'vue'
import {
  type BlindLevel, type TimerState,
  freshState, goToLevel, normaliseLevels, pauseTimer, restoreState, startTimer, tickTimer
} from '~/utils/blindTimer'

const STORAGE_PREFIX = 'pokermanager.timer.v2:'

/**
 * Reactive wrapper around the pure timer logic in utils/blindTimer.ts.
 * Persists to localStorage (per tournament) and plays a short tone on level changes.
 */
export function useBlindTimer() {
  const levels = ref<BlindLevel[]>([])
  const state = ref<TimerState | null>(null)
  const remaining = ref(0)

  let storageKey: string | null = null
  let handle: ReturnType<typeof setInterval> | null = null
  let audioCtx: AudioContext | null = null

  const levelIndex = computed(() => state.value?.levelIndex ?? 0)
  const currentLevel = computed(() => levels.value[levelIndex.value] ?? null)
  const running = computed(() => !!state.value?.running)
  const atFirst = computed(() => levelIndex.value <= 0)
  const atLast = computed(() => levelIndex.value >= levels.value.length - 1)
  const finished = computed(() => atLast.value && remaining.value <= 0 && !running.value)

  function persist() {
    if (!storageKey || !state.value) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(state.value))
    } catch { /* storage unavailable (private mode / quota) - the clock still works */ }
  }

  function primeAudio() {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!Ctx) return
      audioCtx = audioCtx ?? new Ctx()
      if (audioCtx && audioCtx.state === 'suspended') void audioCtx.resume()
    } catch { /* audio is optional */ }
  }

  function beep(count = 1) {
    try {
      if (!audioCtx) return
      const ctx = audioCtx
      for (let i = 0; i < count; i++) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.frequency.value = 880
        gain.gain.value = 0.15
        osc.connect(gain)
        gain.connect(ctx.destination)
        const t = ctx.currentTime + i * 0.35
        osc.start(t)
        osc.stop(t + 0.2)
      }
    } catch { /* audio is optional */ }
  }

  function sync() {
    if (!state.value) return
    if (state.value.running) {
      const res = tickTimer(state.value, levels.value, Date.now())
      state.value = res.state
      if (res.advanced > 0 || res.finished) {
        beep(res.finished ? 3 : 1)
        persist()
      }
    }
    remaining.value = state.value.remaining
  }

  function stopInterval() {
    if (handle) clearInterval(handle)
    handle = null
  }

  /** Call once the tournament has loaded (and again if its blinds change). */
  function load(tournamentId: string | number | undefined, blinds: BlindLevel[]) {
    stopInterval()
    levels.value = normaliseLevels(blinds)
    storageKey = STORAGE_PREFIX + (tournamentId ?? 'default')

    let raw: unknown
    try {
      raw = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
      // v1 keys from the old timer; harmless to remove.
      localStorage.removeItem('currentLevel')
      localStorage.removeItem('timer')
    } catch { raw = null }

    state.value = levels.value.length ? restoreState(raw, levels.value, Date.now()) : freshState(levels.value)
    remaining.value = state.value.remaining
    persist()
    handle = setInterval(sync, 250)
  }

  function play() {
    if (!state.value) return
    primeAudio()
    state.value = startTimer(state.value, Date.now())
    persist()
    sync()
  }

  function pause() {
    if (!state.value) return
    state.value = pauseTimer(state.value, Date.now())
    persist()
    sync()
  }

  /** delta = +1 next level, -1 previous level. Ignored at either end of the schedule. */
  function goTo(delta: number) {
    if (!state.value) return
    const target = state.value.levelIndex + delta
    if (target < 0 || target > levels.value.length - 1) return
    state.value = goToLevel(levels.value, target, state.value.running, Date.now())
    persist()
    sync()
  }

  function resetLevel() {
    if (!state.value) return
    state.value = goToLevel(levels.value, state.value.levelIndex, false, Date.now())
    persist()
    sync()
  }

  function resetAll() {
    if (!state.value) return
    state.value = goToLevel(levels.value, 0, false, Date.now())
    persist()
    sync()
  }

  onBeforeUnmount(stopInterval)

  return {
    levels, remaining, levelIndex, currentLevel, running, atFirst, atLast, finished,
    load, play, pause, goTo, resetLevel, resetAll
  }
}
