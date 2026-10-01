export type Tile = 'correct' | 'present' | 'absent'

/**
 * Two-pass scoring so repeated letters behave like Wordle: exact matches are
 * claimed first, then remaining letters are matched against what is left over.
 */
export function scoreGuess(guess: string, answer: string): Tile[] {
  const result: Tile[] = Array(guess.length).fill('absent')
  const pool = new Map<string, number>()

  for (let i = 0; i < answer.length; i += 1) {
    if (guess[i] === answer[i]) {
      result[i] = 'correct'
    } else {
      pool.set(answer[i], (pool.get(answer[i]) ?? 0) + 1)
    }
  }

  for (let i = 0; i < guess.length; i += 1) {
    if (result[i] === 'correct') continue
    const left = pool.get(guess[i]) ?? 0
    if (left > 0) {
      result[i] = 'present'
      pool.set(guess[i], left - 1)
    }
  }

  return result
}

const RANK: Record<Tile, number> = { absent: 0, present: 1, correct: 2 }

/** Keyboard keys only ever upgrade, never downgrade, across guesses. */
export function mergeKeyStates(
  current: Record<string, Tile>,
  guess: string,
  tiles: Tile[],
): Record<string, Tile> {
  const next = { ...current }
  guess.split('').forEach((letter, i) => {
    const existing = next[letter]
    if (!existing || RANK[tiles[i]] > RANK[existing]) next[letter] = tiles[i]
  })
  return next
}

export const TILE_EMOJI: Record<Tile, string> = {
  correct: '🟩',
  present: '🟨',
  absent: '⬜',
}
