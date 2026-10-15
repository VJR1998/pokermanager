/**
 * Pure, framework-free blind timer logic (unit-tested in tests/blindTimer.test.ts).
 *
 * A running timer is described by an absolute `endsAt` timestamp, so it never
 * drifts, survives background-tab throttling and can be restored after a reload.
 * Levels are addressed by array index (0-based); the UI shows index + 1.
 */

export interface BlindLevel {
  level: number
  blinds: number[]
  level_length: number // minutes
}

export interface TimerState {
  levelIndex: number
  remaining: number // seconds left in the current level (accurate when paused)
  running: boolean
  endsAt: number | null // epoch ms, only while running
}

export interface TickResult {
  state: TimerState
  advanced: number // how many levels were crossed during this tick
  finished: boolean // the last level just ran out
}

const DEFAULT_LEVEL_MINUTES = 20

/** Returns a copy with `level` renumbered 0..n-1. */
export function normaliseLevels(levels: BlindLevel[] | null | undefined): BlindLevel[] {
  return (levels ?? []).map((l, i) => ({ ...l, level: i }))
}

export function clampIndex(levels: BlindLevel[], index: unknown): number {
  if (!levels.length) return 0
  const n = Math.trunc(Number(index))
  if (!Number.isFinite(n)) return 0
  return Math.min(Math.max(n, 0), levels.length - 1)
}

export function levelSeconds(levels: BlindLevel[], index: number): number {
  const mins = Number(levels[index]?.level_length)
  const valid = Number.isFinite(mins) && mins > 0 ? mins : DEFAULT_LEVEL_MINUTES
  return Math.max(1, Math.round(valid * 60))
}

export function freshState(levels: BlindLevel[], index = 0): TimerState {
  const i = clampIndex(levels, index)
  return { levelIndex: i, remaining: levelSeconds(levels, i), running: false, endsAt: null }
}

export function startTimer(state: TimerState, now: number): TimerState {
  if (state.running || state.remaining <= 0) return state
  return { ...state, running: true, endsAt: now + state.remaining * 1000 }
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (!state.running || state.endsAt == null) return state
  return {
    ...state,
    running: false,
    remaining: Math.max(0, Math.ceil((state.endsAt - now) / 1000)),
    endsAt: null
  }
}

/** Advances a running timer to `now`, rolling over into following levels and stopping after the last. */
export function tickTimer(state: TimerState, levels: BlindLevel[], now: number): TickResult {
  if (!state.running || state.endsAt == null || !levels.length) {
    return { state, advanced: 0, finished: false }
  }

  let levelIndex = state.levelIndex
  let endsAt = state.endsAt
  let advanced = 0

  while (now >= endsAt) {
    if (levelIndex >= levels.length - 1) {
      return {
        state: { levelIndex, remaining: 0, running: false, endsAt: null },
        advanced,
        finished: true
      }
    }
    levelIndex++
    advanced++
    endsAt += levelSeconds(levels, levelIndex) * 1000
  }

  return {
    state: { levelIndex, remaining: Math.ceil((endsAt - now) / 1000), running: true, endsAt },
    advanced,
    finished: false
  }
}

/** Jump to a level with a full clock; keeps running if asked to. */
export function goToLevel(levels: BlindLevel[], index: number, running: boolean, now: number): TimerState {
  const fresh = freshState(levels, index)
  return running ? startTimer(fresh, now) : fresh
}

/** Rebuilds a timer from whatever was in storage, tolerating stale or corrupt data. */
export function restoreState(raw: unknown, levels: BlindLevel[], now: number): TimerState {
  if (!levels.length) return freshState(levels)
  if (!raw || typeof raw !== 'object') return freshState(levels)

  const r = raw as Partial<TimerState>
  const idx = clampIndex(levels, r.levelIndex)
  const max = levelSeconds(levels, idx)

  if (r.running && typeof r.endsAt === 'number' && Number.isFinite(r.endsAt)) {
    return tickTimer({ levelIndex: idx, remaining: max, running: true, endsAt: r.endsAt }, levels, now).state
  }

  const rem = Math.round(Number(r.remaining))
  if (!Number.isFinite(rem)) return freshState(levels, idx)
  if (rem <= 0 && idx < levels.length - 1) return freshState(levels, idx + 1)

  return { levelIndex: idx, remaining: Math.min(Math.max(rem, 0), max), running: false, endsAt: null }
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  const mins = Math.floor(s / 60)
  const secs = s % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
