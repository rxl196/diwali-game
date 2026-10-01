import { decode } from './encoding'

export const SIZE = 5
export const BLOCK = '#'

/** Base64 so the solution is not readable in the shipped bundle. */
const ENCODED_SOLUTION = 'WyJDSEkjIyIsIkhFTk5BIiwiQVJET1IiLCJJRElPTSIsIiMjQU5ZIl0='

/** Row-major solution; `#` marks a blocked square. */
export const SOLUTION: string[] = JSON.parse(
  decode(ENCODED_SOLUTION),
) as string[]

export type Direction = 'across' | 'down'

export type Clue = {
  number: number
  direction: Direction
  row: number
  col: number
  length: number
  text: string
}

export const CLUE_TEXT: Record<string, string> = {
  '1-across': 'Greek letter between phi and psi',
  '4-across': 'Reddish dye used for festive hand designs',
  '7-across': 'Great passion or enthusiasm',
  '8-across': '"Break a leg," for one',
  '9-across': '"___ questions?"',
  '1-down': 'Spiced tea poured at Diwali gatherings',
  '2-down': 'Group of cattle',
  '3-down': 'Country where Diwali is a national holiday',
  '5-down': 'Midday',
  '6-down': 'Large military force',
}

export function isBlock(row: number, col: number): boolean {
  return SOLUTION[row][col] === BLOCK
}

/**
 * Standard crossword numbering: a square is numbered when it begins an across
 * or down entry, scanning in reading order.
 */
export function buildClues(): Clue[] {
  const clues: Clue[] = []
  let number = 0

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (isBlock(row, col)) continue

      const startsAcross =
        (col === 0 || isBlock(row, col - 1)) &&
        col + 1 < SIZE &&
        !isBlock(row, col + 1)
      const startsDown =
        (row === 0 || isBlock(row - 1, col)) &&
        row + 1 < SIZE &&
        !isBlock(row + 1, col)

      if (!startsAcross && !startsDown) continue
      number += 1

      if (startsAcross) {
        let length = 0
        while (col + length < SIZE && !isBlock(row, col + length)) length += 1
        clues.push({
          number,
          direction: 'across',
          row,
          col,
          length,
          text: CLUE_TEXT[`${number}-across`] ?? '',
        })
      }

      if (startsDown) {
        let length = 0
        while (row + length < SIZE && !isBlock(row + length, col)) length += 1
        clues.push({
          number,
          direction: 'down',
          row,
          col,
          length,
          text: CLUE_TEXT[`${number}-down`] ?? '',
        })
      }
    }
  }

  return clues
}

export const CLUES = buildClues()

/** Square number lookup keyed by `row,col`, for rendering the small labels. */
export const NUMBERS: Record<string, number> = CLUES.reduce<
  Record<string, number>
>((acc, clue) => {
  acc[`${clue.row},${clue.col}`] = clue.number
  return acc
}, {})

export function cellsOf(clue: Clue): [number, number][] {
  return Array.from({ length: clue.length }, (_, i) =>
    clue.direction === 'across'
      ? ([clue.row, clue.col + i] as [number, number])
      : ([clue.row + i, clue.col] as [number, number]),
  )
}
