import { PUZZLE_ID } from '../data/puzzleId'
import type { GameId, GameResult, ResultsMap } from './types'

const SCHEMA_VERSION = 1
const NAMESPACE = `diwali:v${SCHEMA_VERSION}:${PUZZLE_ID}`

const RESULTS_KEY = `${NAMESPACE}:results`
const progressKey = (game: GameId) => `${NAMESPACE}:progress:${game}`

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode, embedded webviews). Gameplay
    // still works in-memory, so failing to persist is non-fatal.
  }
}

export function loadResults(): ResultsMap {
  return read<ResultsMap>(RESULTS_KEY, {})
}

export function saveResult(result: GameResult): ResultsMap {
  const next = { ...loadResults(), [result.game]: result }
  write(RESULTS_KEY, next)
  return next
}

export function loadProgress<T>(game: GameId, fallback: T): T {
  return read<T>(progressKey(game), fallback)
}

export function saveProgress<T>(game: GameId, state: T): void {
  write(progressKey(game), state)
}

export function resetAll(): void {
  try {
    const doomed: string[] = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key?.startsWith('diwali:')) doomed.push(key)
    }
    doomed.forEach((key) => localStorage.removeItem(key))
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
