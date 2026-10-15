import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normaliseLevels, levelSeconds, freshState, startTimer, pauseTimer, tickTimer,
  goToLevel, restoreState, formatTime, clampIndex
} from '../app/utils/blindTimer.ts'

const levels = normaliseLevels([
  { level: 5, blinds: [100, 200], level_length: 1 }, // 60 s
  { level: 9, blinds: [200, 400], level_length: 2 }, // 120 s
  { level: 2, blinds: [300, 600], level_length: 1 }  // 60 s
])
const T0 = 1_000_000

test('normaliseLevels renumbers contiguously from 0 without mutating input', () => {
  const input = [{ level: 7, blinds: [1, 2], level_length: 5 }, { level: 7, blinds: [2, 4], level_length: 5 }]
  const out = normaliseLevels(input)
  assert.deepEqual(out.map(l => l.level), [0, 1])
  assert.equal(input[0].level, 7)
  assert.deepEqual(normaliseLevels(null), [])
})

test('levelSeconds falls back to 20 minutes for bad data', () => {
  assert.equal(levelSeconds(levels, 1), 120)
  assert.equal(levelSeconds([{ level: 0, blinds: [1, 2], level_length: 0 }], 0), 1200)
  assert.equal(levelSeconds([], 3), 1200)
})

test('clampIndex stays in range and tolerates junk', () => {
  assert.equal(clampIndex(levels, -4), 0)
  assert.equal(clampIndex(levels, 99), 2)
  assert.equal(clampIndex(levels, 'abc'), 0)
  assert.equal(clampIndex([], 3), 0)
})

test('start / pause keep the remaining time exact', () => {
  let s = startTimer(freshState(levels, 0), T0)
  assert.equal(s.running, true)
  assert.equal(s.endsAt, T0 + 60_000)
  s = pauseTimer(s, T0 + 15_500)
  assert.equal(s.running, false)
  assert.equal(s.remaining, 45) // ceil(44.5)
  s = startTimer(s, T0 + 100_000)
  assert.equal(s.endsAt, T0 + 145_000)
})

test('tick counts down without drifting and does not advance mid-level', () => {
  const s = startTimer(freshState(levels, 0), T0)
  const r = tickTimer(s, levels, T0 + 10_000)
  assert.equal(r.state.remaining, 50)
  assert.equal(r.advanced, 0)
  assert.equal(r.finished, false)
})

test('tick auto-advances to the next level and keeps running', () => {
  const s = startTimer(freshState(levels, 0), T0)
  const r = tickTimer(s, levels, T0 + 61_000)
  assert.equal(r.state.levelIndex, 1)
  assert.equal(r.advanced, 1)
  assert.equal(r.state.running, true)
  assert.equal(r.state.remaining, 119) // 120 s level minus the 1 s overshoot
})

test('tick after a long gap rolls through several levels', () => {
  const s = startTimer(freshState(levels, 0), T0)
  const r = tickTimer(s, levels, T0 + 60_000 + 120_000 + 10_000) // into level 2, 10 s in
  assert.equal(r.state.levelIndex, 2)
  assert.equal(r.advanced, 2)
  assert.equal(r.state.remaining, 50)
})

test('tick stops at the end of the last level instead of running off the schedule', () => {
  const s = startTimer(freshState(levels, 2), T0)
  const r = tickTimer(s, levels, T0 + 90_000)
  assert.equal(r.finished, true)
  assert.equal(r.state.levelIndex, 2)
  assert.equal(r.state.remaining, 0)
  assert.equal(r.state.running, false)
  assert.equal(startTimer(r.state, T0 + 100_000).running, false) // cannot restart a finished clock
})

test('goToLevel clamps out-of-range targets (no undefined level)', () => {
  assert.equal(goToLevel(levels, 3, false, T0).levelIndex, 2)
  assert.equal(goToLevel(levels, -1, false, T0).levelIndex, 0)
  const running = goToLevel(levels, 1, true, T0)
  assert.equal(running.running, true)
  assert.equal(running.remaining, 120)
})

test('restoreState rejects garbage and falls back to a fresh clock', () => {
  for (const raw of [null, undefined, 'x', 42, {}, { levelIndex: 'a', remaining: 'b' }]) {
    const s = restoreState(raw, levels, T0)
    assert.equal(s.levelIndex, 0)
    assert.equal(s.running, false)
    assert.equal(s.remaining, 60)
  }
  assert.equal(restoreState({ levelIndex: 1, remaining: 30 }, [], T0).remaining, 1200)
})

test('restoreState coerces string/zero remaining instead of counting negative', () => {
  assert.equal(restoreState({ levelIndex: 0, remaining: '45' }, levels, T0).remaining, 45)
  assert.equal(restoreState({ levelIndex: 0, remaining: 9999 }, levels, T0).remaining, 60)
  const zeroMid = restoreState({ levelIndex: 0, remaining: 0 }, levels, T0)
  assert.equal(zeroMid.levelIndex, 1) // a drained level moves on
  assert.equal(zeroMid.remaining, 120)
  const zeroLast = restoreState({ levelIndex: 2, remaining: 0 }, levels, T0)
  assert.equal(zeroLast.levelIndex, 2)
  assert.equal(zeroLast.remaining, 0)
})

test('restoreState resumes a clock that was running when the page closed', () => {
  const raw = { levelIndex: 0, remaining: 60, running: true, endsAt: T0 + 20_000 }
  const s = restoreState(raw, levels, T0 + 5_000)
  assert.equal(s.running, true)
  assert.equal(s.remaining, 15)
  const late = restoreState(raw, levels, T0 + 30_000) // 10 s after level 0 ended
  assert.equal(late.levelIndex, 1)
  assert.equal(late.remaining, 110)
})

test('restoreState clamps a stored level that no longer exists (blinds were edited)', () => {
  const s = restoreState({ levelIndex: 12, remaining: 10 }, levels, T0)
  assert.equal(s.levelIndex, 2)
  assert.equal(s.remaining, 10)
})

test('formatTime pads, floors and never shows negatives', () => {
  assert.equal(formatTime(0), '00:00')
  assert.equal(formatTime(65), '01:05')
  assert.equal(formatTime(3600), '60:00')
  assert.equal(formatTime(-5), '00:00')
  assert.equal(formatTime(59.9), '00:59')
  assert.equal(formatTime(Number('x')), '00:00')
})
