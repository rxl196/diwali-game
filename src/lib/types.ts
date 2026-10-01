export type GameId = 'crossword' | 'connections' | 'diyadle'

export type GameResult = {
  game: GameId
  /** Player reached a terminal state (win or loss). */
  completed: boolean
  /** Player reached a terminal state successfully. */
  solved: boolean
  /** Emoji rows shown in the shared summary. Must never leak answers. */
  grid: string[]
  /** Short human-readable stat, e.g. "1:42", "3 mistakes", "4/6". */
  stat: string
  /** ISO timestamp of completion. */
  finishedAt: string
}

export type ResultsMap = Partial<Record<GameId, GameResult>>

export const GAME_ORDER: GameId[] = ['crossword', 'connections', 'diyadle']

export const GAME_META: Record<
  GameId,
  { title: string; tagline: string; icon: string }
> = {
  crossword: {
    title: 'Mini Crossword',
    tagline: 'A 5×5 grid with a festive twist',
    icon: '✳️',
  },
  connections: {
    title: 'Connections',
    tagline: 'Find the four hidden groups',
    icon: '🪔',
  },
  diyadle: {
    title: 'Diyadle',
    tagline: 'Guess the word in six tries',
    icon: '🎆',
  },
}
