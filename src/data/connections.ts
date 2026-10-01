import { decode } from './encoding'
import type { GameId } from '../lib/types'

export type ConnectionsGroup = {
  /** 0 = easiest (yellow) through 3 = hardest (purple). */
  level: 0 | 1 | 2 | 3
  category: string
  members: string[]
}

export const CONNECTIONS_ID: GameId = 'connections'
export const MAX_MISTAKES = 4

export const LEVEL_COLORS = ['🟨', '🟩', '🟦', '🟪']
export const LEVEL_NAMES = ['yellow', 'green', 'blue', 'purple']

// Encoded so the groupings are not readable straight out of the bundle.
const ENCODED_GROUPS =
  'W3sibGV2ZWwiOjAsImNhdGVnb3J5IjoiSW5kaWFuIHN3ZWV0cyIsIm1lbWJlcnMiOlsiTEFERFUiLCJCQVJGSSIsIkhBTFdBIiwiS0hFRVIiXX0seyJsZXZlbCI6MSwiY2F0ZWdvcnkiOiJUaGluZ3MgdGhhdCBnaXZlIG9mZiBsaWdodCIsIm1lbWJlcnMiOlsiRElZQSIsIlNQQVJLTEVSIiwiQ0FORExFIiwiTEFOVEVSTiJdfSx7ImxldmVsIjoyLCJjYXRlZ29yeSI6IlRyYWRpdGlvbmFsIHJhbmdvbGkgbWF0ZXJpYWxzIiwibWVtYmVycyI6WyJSSUNFIiwiU0FORCIsIkNIQUxLIiwiRkxPVVIiXX0seyJsZXZlbCI6MywiY2F0ZWdvcnkiOiJfX18gKyBDUkFDS0VSIiwibWVtYmVycyI6WyJGSVJFIiwiU0FGRSIsIk5VVCIsIldJU0UiXX1d'

export const CONNECTIONS_GROUPS: ConnectionsGroup[] = JSON.parse(
  decode(ENCODED_GROUPS),
) as ConnectionsGroup[]

/**
 * Fixed shuffle so every player sees the same starting board (and so the
 * board never accidentally starts pre-grouped).
 */
export const CONNECTIONS_BOARD: string[] = [
  'RICE',
  'FIRE',
  'LADDU',
  'CANDLE',
  'NUT',
  'HALWA',
  'CHALK',
  'SPARKLER',
  'KHEER',
  'SAND',
  'WISE',
  'DIYA',
  'BARFI',
  'LANTERN',
  'FLOUR',
  'SAFE',
]

export function groupFor(word: string): ConnectionsGroup {
  const group = CONNECTIONS_GROUPS.find((g) => g.members.includes(word))
  if (!group) throw new Error(`No Connections group contains "${word}"`)
  return group
}
