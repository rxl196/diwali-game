import { useCallback, useEffect, useMemo, useState } from 'react'
import { GameShell } from '../../components/GameShell'
import { Modal } from '../../components/Modal'
import { Toast } from '../../components/Toast'
import { useToast } from '../../components/useToast'
import {
  CONNECTIONS_BOARD,
  CONNECTIONS_GROUPS,
  LEVEL_COLORS,
  MAX_MISTAKES,
  groupFor,
} from '../../data/connections'
import { loadProgress, saveProgress, saveResult } from '../../lib/storage'
import { GAME_META } from '../../lib/types'
import type { GameResult } from '../../lib/types'
import './Connections.css'

type SavedState = {
  /** Levels the player has cleared, plus any revealed on a loss. */
  solved: number[]
  /** One entry per submitted guess, holding the true level of each tile. */
  guesses: number[][]
  mistakes: number
  finished: boolean
  won: boolean
}

const EMPTY: SavedState = {
  solved: [],
  guesses: [],
  mistakes: 0,
  finished: false,
  won: false,
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function guessRows(guesses: number[][]): string[] {
  return guesses.map((levels) => levels.map((l) => LEVEL_COLORS[l]).join(''))
}

export function Connections({
  onBack,
  onFinish,
}: {
  onBack: () => void
  onFinish: () => void
}) {
  const [state, setState] = useState<SavedState>(() =>
    loadProgress<SavedState>('connections', EMPTY),
  )
  const [selected, setSelected] = useState<string[]>([])
  const [shaking, setShaking] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showSummary, setShowSummary] = useState(state.finished)
  const { message, show } = useToast()

  const solvedGroups = useMemo(
    () =>
      state.solved
        .map((level) => CONNECTIONS_GROUPS.find((g) => g.level === level))
        .filter((g): g is NonNullable<typeof g> => Boolean(g)),
    [state.solved],
  )

  const solvedWords = useMemo(
    () => new Set(solvedGroups.flatMap((g) => g.members)),
    [solvedGroups],
  )

  const [tiles, setTiles] = useState<string[]>(CONNECTIONS_BOARD)

  const remaining = useMemo(
    () => tiles.filter((w) => !solvedWords.has(w)),
    [tiles, solvedWords],
  )

  useEffect(() => {
    saveProgress('connections', state)
  }, [state])

  const finish = useCallback(
    (guesses: number[][], mistakes: number, cleared: number) => {
      const won = cleared === CONNECTIONS_GROUPS.length
      const result: GameResult = {
        game: 'connections',
        completed: true,
        solved: won,
        grid: guessRows(guesses),
        stat: won
          ? mistakes === 0
            ? 'perfect'
            : `${mistakes} mistake${mistakes === 1 ? '' : 's'}`
          : `${cleared}/4 groups`,
        finishedAt: new Date().toISOString(),
      }
      saveResult(result)
      onFinish()
      window.setTimeout(() => setShowSummary(true), 700)
    },
    [onFinish],
  )

  const toggle = (word: string) => {
    if (state.finished) return
    setSelected((prev) => {
      if (prev.includes(word)) return prev.filter((w) => w !== word)
      if (prev.length >= 4) return prev
      return [...prev, word]
    })
  }

  const submit = () => {
    if (selected.length !== 4 || state.finished) return

    const levels = selected.map((w) => groupFor(w).level)
    const alreadyGuessed = state.guesses.some(
      (g) => [...g].sort().join() === [...levels].sort().join(),
    )

    const target = CONNECTIONS_GROUPS.find(
      (g) => selected.every((w) => g.members.includes(w)) && selected.length === 4,
    )

    if (!target && alreadyGuessed) {
      show('Already guessed!')
      return
    }

    const guesses = [...state.guesses, levels]

    if (target) {
      const solved = [...state.solved, target.level]
      const solvedAll = solved.length === CONNECTIONS_GROUPS.length
      const next: SavedState = {
        ...state,
        solved,
        guesses,
        finished: solvedAll,
        won: solvedAll,
      }
      setState(next)
      setSelected([])
      if (solvedAll) finish(guesses, state.mistakes, solved.length)
      return
    }

    const counts = new Map<number, number>()
    levels.forEach((l) => counts.set(l, (counts.get(l) ?? 0) + 1))
    const oneAway = [...counts.values()].includes(3)

    const mistakes = state.mistakes + 1
    const outOfLives = mistakes >= MAX_MISTAKES
    const cleared = state.solved.length
    const next: SavedState = {
      ...state,
      guesses,
      mistakes,
      // Reveal every remaining group when the player runs out of lives.
      solved: outOfLives
        ? CONNECTIONS_GROUPS.map((g) => g.level)
        : state.solved,
      finished: outOfLives,
      won: false,
    }

    setShaking(true)
    window.setTimeout(() => setShaking(false), 500)
    if (oneAway && !outOfLives) show('One away…')

    setState(next)
    setSelected([])
    if (outOfLives) finish(guesses, mistakes, cleared)
  }

  const livesLeft = MAX_MISTAKES - state.mistakes

  return (
    <GameShell
      title={GAME_META.connections.title}
      icon={GAME_META.connections.icon}
      onBack={onBack}
      onHelp={() => setShowHelp(true)}
    >
      <p className="cx-prompt">Create four groups of four!</p>

      <div className="cx-board">
        {solvedGroups
          .slice()
          .sort((a, b) => a.level - b.level)
          .map((group) => (
            <div
              key={group.level}
              className={`cx-solved cx-level-${group.level}`}
            >
              <strong>{group.category}</strong>
              <span>{group.members.join(', ')}</span>
            </div>
          ))}

        {remaining.length > 0 && (
          <div className="cx-grid">
            {remaining.map((word) => (
              <button
                key={word}
                type="button"
                className={[
                  'cx-tile',
                  selected.includes(word) ? 'is-selected' : '',
                  shaking && selected.includes(word) ? 'is-shaking' : '',
                  word.length > 7 ? 'is-long' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => toggle(word)}
                aria-pressed={selected.includes(word)}
              >
                {word}
              </button>
            ))}
          </div>
        )}
      </div>

      {!state.finished && (
        <>
          <div className="cx-lives">
            <span>Mistakes remaining:</span>
            <span className="cx-dots">
              {Array.from({ length: MAX_MISTAKES }, (_, i) => (
                <i key={i} className={i < livesLeft ? 'on' : 'off'} />
              ))}
            </span>
          </div>

          <div className="cx-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setTiles((t) => shuffle(t))}
            >
              Shuffle
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setSelected([])}
              disabled={selected.length === 0}
            >
              Deselect all
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={submit}
              disabled={selected.length !== 4}
            >
              Submit
            </button>
          </div>
        </>
      )}

      {state.finished && (
        <div className="cx-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowSummary(true)}
          >
            See results
          </button>
        </div>
      )}

      <Toast message={message} />

      <Modal
        open={showHelp}
        title="How to play"
        onClose={() => setShowHelp(false)}
      >
        <p>Find groups of four items that share something in common.</p>
        <ul>
          <li>Select four tiles, then hit Submit.</li>
          <li>You get four mistakes before the game ends.</li>
          <li>Categories are always more specific than "5-letter words".</li>
        </ul>
      </Modal>

      <Modal
        open={showSummary}
        title={state.won ? 'Nailed it! 🎉' : 'Next time! 🪔'}
        onClose={() => setShowSummary(false)}
      >
        <div className="cx-summary-grid">
          {guessRows(state.guesses).map((row, i) => (
            <div key={i}>{row}</div>
          ))}
        </div>
        <p className="cx-summary-note">
          Your result is saved. Head back to the hub to share all three games at
          once.
        </p>
        <button type="button" className="btn btn-primary btn-block" onClick={onBack}>
          Back to games
        </button>
      </Modal>
    </GameShell>
  )
}
