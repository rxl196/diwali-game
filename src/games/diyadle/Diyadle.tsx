import { useCallback, useEffect, useMemo, useState } from 'react'
import { GameShell } from '../../components/GameShell'
import { Modal } from '../../components/Modal'
import { Toast } from '../../components/Toast'
import { useToast } from '../../components/useToast'
import {
  ANSWER,
  ANSWER_NOTE,
  HINT,
  MAX_GUESSES,
  WORD_LENGTH,
  isValidGuess,
} from '../../data/diyadle'
import { TILE_EMOJI, mergeKeyStates, scoreGuess } from '../../lib/scoring'
import type { Tile } from '../../lib/scoring'
import { loadProgress, saveProgress, saveResult } from '../../lib/storage'
import { GAME_META } from '../../lib/types'
import type { GameResult } from '../../lib/types'
import { Keyboard } from './Keyboard'
import './Diyadle.css'

type SavedState = {
  guesses: string[]
  finished: boolean
  won: boolean
}

const EMPTY: SavedState = { guesses: [], finished: false, won: false }

export function Diyadle({
  onBack,
  onFinish,
}: {
  onBack: () => void
  onFinish: () => void
}) {
  const [state, setState] = useState<SavedState>(() =>
    loadProgress<SavedState>('diyadle', EMPTY),
  )
  const [current, setCurrent] = useState('')
  const [shakeRow, setShakeRow] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showSummary, setShowSummary] = useState(state.finished)
  const { message, show } = useToast()

  const scored = useMemo(
    () => state.guesses.map((g) => scoreGuess(g, ANSWER)),
    [state.guesses],
  )

  const keyStates = useMemo(
    () =>
      state.guesses.reduce<Record<string, Tile>>(
        (acc, guess, i) => mergeKeyStates(acc, guess, scored[i]),
        {},
      ),
    [state.guesses, scored],
  )

  useEffect(() => {
    saveProgress('diyadle', state)
  }, [state])

  const finish = useCallback(
    (guesses: string[], won: boolean) => {
      const grid = guesses.map((g) =>
        scoreGuess(g, ANSWER)
          .map((t) => TILE_EMOJI[t])
          .join(''),
      )
      const result: GameResult = {
        game: 'diyadle',
        completed: true,
        solved: won,
        grid,
        stat: won ? `${guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`,
        finishedAt: new Date().toISOString(),
      }
      saveResult(result)
      onFinish()
      window.setTimeout(() => setShowSummary(true), 1200)
    },
    [onFinish],
  )

  const submit = useCallback(() => {
    if (state.finished) return

    if (current.length !== WORD_LENGTH) {
      setShakeRow(true)
      show('Not enough letters')
      return
    }

    if (!isValidGuess(current)) {
      setShakeRow(true)
      show('Not in word list')
      return
    }

    const guesses = [...state.guesses, current]
    const won = current === ANSWER
    const done = won || guesses.length >= MAX_GUESSES

    setState({ guesses, finished: done, won })
    setCurrent('')

    if (done) finish(guesses, won)
    else if (guesses.length === 3) show(`Hint: ${HINT}`)
  }, [current, state, finish, show])

  const handleKey = useCallback(
    (key: string) => {
      if (state.finished) return
      if (key === 'ENTER') {
        submit()
        return
      }
      if (key === 'BACKSPACE') {
        setCurrent((c) => c.slice(0, -1))
        return
      }
      if (/^[A-Z]$/.test(key)) {
        setCurrent((c) => (c.length < WORD_LENGTH ? c + key : c))
      }
    },
    [state.finished, submit],
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toUpperCase()
      if (key === 'ENTER' || key === 'BACKSPACE' || /^[A-Z]$/.test(key)) {
        e.preventDefault()
        handleKey(key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKey])

  useEffect(() => {
    if (!shakeRow) return
    const id = window.setTimeout(() => setShakeRow(false), 480)
    return () => window.clearTimeout(id)
  }, [shakeRow])

  const rows = Array.from({ length: MAX_GUESSES }, (_, r) => {
    if (r < state.guesses.length) {
      return { letters: state.guesses[r].split(''), tiles: scored[r] }
    }
    if (r === state.guesses.length && !state.finished) {
      return {
        letters: current.padEnd(WORD_LENGTH, ' ').split(''),
        tiles: null,
        active: true,
      }
    }
    return { letters: Array(WORD_LENGTH).fill(' '), tiles: null }
  })

  return (
    <GameShell
      title={GAME_META.diyadle.title}
      icon={GAME_META.diyadle.icon}
      onBack={onBack}
      onHelp={() => setShowHelp(true)}
    >
      <div className="dy-board">
        {rows.map((row, r) => (
          <div
            key={r}
            className={`dy-row ${row.active && shakeRow ? 'is-shaking' : ''}`}
          >
            {row.letters.map((letter, c) => (
              <div
                key={c}
                className={[
                  'dy-tile',
                  row.tiles ? `is-${row.tiles[c]} is-revealed` : '',
                  letter !== ' ' && !row.tiles ? 'is-filled' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={row.tiles ? { animationDelay: `${c * 90}ms` } : undefined}
              >
                {letter.trim()}
              </div>
            ))}
          </div>
        ))}
      </div>

      {state.finished && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowSummary(true)}
        >
          See results
        </button>
      )}

      <Keyboard
        keyStates={keyStates}
        onKey={handleKey}
        disabled={state.finished}
      />

      <Toast message={message} />

      <Modal
        open={showHelp}
        title="How to play"
        onClose={() => setShowHelp(false)}
      >
        <p>
          Guess the {WORD_LENGTH}-letter Diwali word in {MAX_GUESSES} tries.
        </p>
        <ul>
          <li>🟩 right letter, right spot</li>
          <li>🟨 right letter, wrong spot</li>
          <li>⬜ not in the word</li>
        </ul>
        <p>A hint appears after three guesses.</p>
      </Modal>

      <Modal
        open={showSummary}
        title={state.won ? 'Beautifully done! 🎉' : 'So close! 🪔'}
        onClose={() => setShowSummary(false)}
      >
        <p className="dy-answer">
          The word was <strong>{ANSWER}</strong>
        </p>
        <p className="dy-note">{ANSWER_NOTE}</p>
        <div className="dy-summary-grid">
          {state.guesses.map((g, i) => (
            <div key={i}>
              {scoreGuess(g, ANSWER)
                .map((t) => TILE_EMOJI[t])
                .join('')}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={onBack}
        >
          Back to games
        </button>
      </Modal>
    </GameShell>
  )
}
