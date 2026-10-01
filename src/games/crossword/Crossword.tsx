import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GameShell } from '../../components/GameShell'
import { Modal } from '../../components/Modal'
import { Toast } from '../../components/Toast'
import { useToast } from '../../components/useToast'
import {
  BLOCK,
  CLUES,
  NUMBERS,
  SIZE,
  SOLUTION,
  cellsOf,
  isBlock,
} from '../../data/crossword'
import type { Clue, Direction } from '../../data/crossword'
import { loadProgress, saveProgress, saveResult } from '../../lib/storage'
import { GAME_META } from '../../lib/types'
import type { GameResult } from '../../lib/types'
import './Crossword.css'

type SavedState = {
  /** Row-major player entries; `#` for blocks, '' for empty squares. */
  cells: string[][]
  seconds: number
  finished: boolean
  revealed: boolean
}

const emptyCells = () =>
  SOLUTION.map((row) => row.split('').map((ch) => (ch === BLOCK ? BLOCK : '')))

const EMPTY: SavedState = {
  cells: emptyCells(),
  seconds: 0,
  finished: false,
  revealed: false,
}

function formatTime(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function Crossword({
  onBack,
  onFinish,
}: {
  onBack: () => void
  onFinish: () => void
}) {
  const [state, setState] = useState<SavedState>(() =>
    loadProgress<SavedState>('crossword', EMPTY),
  )
  const [cursor, setCursor] = useState<[number, number]>([0, 0])
  const [direction, setDirection] = useState<Direction>('across')
  const [showHelp, setShowHelp] = useState(false)
  const [showSummary, setShowSummary] = useState(state.finished)
  const { message, show } = useToast()
  const gridRef = useRef<HTMLDivElement>(null)
  const finishedRef = useRef(state.finished)

  useEffect(() => {
    saveProgress('crossword', state)
    finishedRef.current = state.finished
  }, [state])

  useEffect(() => {
    if (state.finished) return
    const id = window.setInterval(() => {
      setState((prev) =>
        prev.finished ? prev : { ...prev, seconds: prev.seconds + 1 },
      )
    }, 1000)
    return () => window.clearInterval(id)
  }, [state.finished])

  const activeClue: Clue = useMemo(() => {
    const [row, col] = cursor
    const match = CLUES.find(
      (clue) =>
        clue.direction === direction &&
        cellsOf(clue).some(([r, c]) => r === row && c === col),
    )
    // Some squares only belong to an entry in one direction.
    return (
      match ??
      CLUES.find((clue) =>
        cellsOf(clue).some(([r, c]) => r === row && c === col),
      ) ??
      CLUES[0]
    )
  }, [cursor, direction])

  const activeCells = useMemo(() => cellsOf(activeClue), [activeClue])

  const complete = useCallback((cells: string[][]) => {
    for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        if (isBlock(r, c)) continue
        if (cells[r][c] !== SOLUTION[r][c]) return false
      }
    }
    return true
  }, [])

  const finish = useCallback(
    (seconds: number, solved: boolean) => {
      const result: GameResult = {
        game: 'crossword',
        completed: true,
        solved,
        grid: [],
        stat: solved ? `⏱ ${formatTime(seconds)}` : 'revealed',
        finishedAt: new Date().toISOString(),
      }
      saveResult(result)
      onFinish()
      window.setTimeout(() => setShowSummary(true), 500)
    },
    [onFinish],
  )

  const moveTo = (row: number, col: number) => {
    if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return
    if (isBlock(row, col)) return
    setCursor([row, col])
  }

  const selectCell = (row: number, col: number) => {
    if (isBlock(row, col)) return
    const [cr, cc] = cursor
    if (cr === row && cc === col) {
      setDirection((d) => {
        const other: Direction = d === 'across' ? 'down' : 'across'
        const hasOther = CLUES.some(
          (clue) =>
            clue.direction === other &&
            cellsOf(clue).some(([r, c]) => r === row && c === col),
        )
        return hasOther ? other : d
      })
      return
    }
    setCursor([row, col])
  }

  const advance = useCallback(
    (back: boolean) => {
      const [row, col] = cursor
      const idx = activeCells.findIndex(([r, c]) => r === row && c === col)
      const next = activeCells[idx + (back ? -1 : 1)]
      if (next) setCursor(next)
    },
    [cursor, activeCells],
  )

  const typeLetter = useCallback(
    (letter: string) => {
      if (finishedRef.current) return
      const [row, col] = cursor
      setState((prev) => {
        const cells = prev.cells.map((r) => [...r])
        cells[row][col] = letter
        const solved = complete(cells)
        if (solved) {
          finish(prev.seconds, true)
          return { ...prev, cells, finished: true }
        }
        return { ...prev, cells }
      })
      advance(false)
    },
    [cursor, advance, complete, finish],
  )

  const backspace = useCallback(() => {
    if (finishedRef.current) return
    const [row, col] = cursor
    setState((prev) => {
      const cells = prev.cells.map((r) => [...r])
      if (cells[row][col]) {
        cells[row][col] = ''
        return { ...prev, cells }
      }
      return prev
    })
    if (!state.cells[row][col]) advance(true)
  }, [cursor, state.cells, advance])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const [row, col] = cursor

      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault()
        typeLetter(e.key.toUpperCase())
        return
      }
      switch (e.key) {
        case 'Backspace':
          e.preventDefault()
          backspace()
          break
        case 'ArrowUp':
          e.preventDefault()
          setDirection('down')
          moveTo(row - 1, col)
          break
        case 'ArrowDown':
          e.preventDefault()
          setDirection('down')
          moveTo(row + 1, col)
          break
        case 'ArrowLeft':
          e.preventDefault()
          setDirection('across')
          moveTo(row, col - 1)
          break
        case 'ArrowRight':
          e.preventDefault()
          setDirection('across')
          moveTo(row, col + 1)
          break
        case ' ':
        case 'Tab':
          e.preventDefault()
          setDirection((d) => (d === 'across' ? 'down' : 'across'))
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [cursor, typeLetter, backspace])

  const stepClue = (delta: number) => {
    const ordered = CLUES.filter((c) => c.direction === direction)
    const idx = ordered.findIndex(
      (c) => c.number === activeClue.number && c.direction === activeClue.direction,
    )
    const next = ordered[(idx + delta + ordered.length) % ordered.length]
    if (next) {
      setDirection(next.direction)
      setCursor([next.row, next.col])
    }
  }

  const check = () => {
    const wrong = state.cells.some((row, r) =>
      row.some((value, c) => !isBlock(r, c) && value && value !== SOLUTION[r][c]),
    )
    show(wrong ? 'Something is not quite right' : 'Looking good so far!')
  }

  const reveal = () => {
    const cells = SOLUTION.map((row) => row.split(''))
    setState((prev) => ({ ...prev, cells, finished: true, revealed: true }))
    finish(state.seconds, false)
  }

  const [cursorRow, cursorCol] = cursor

  return (
    <GameShell
      title={GAME_META.crossword.title}
      icon={GAME_META.crossword.icon}
      onBack={onBack}
      onHelp={() => setShowHelp(true)}
    >
      <div className="xw-timer">⏱ {formatTime(state.seconds)}</div>

      <div className="xw-grid" ref={gridRef} role="grid">
        {Array.from({ length: SIZE }, (_, row) => (
          <div className="xw-grid-row" key={row} role="row">
            {Array.from({ length: SIZE }, (_, col) => {
              if (isBlock(row, col)) {
                return <div key={col} className="xw-cell is-block" role="gridcell" />
              }
              const inClue = activeCells.some(([r, c]) => r === row && c === col)
              const isCursor = row === cursorRow && col === cursorCol
              const number = NUMBERS[`${row},${col}`]
              return (
                <button
                  key={col}
                  type="button"
                  role="gridcell"
                  className={[
                    'xw-cell',
                    inClue ? 'is-in-clue' : '',
                    isCursor ? 'is-cursor' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => selectCell(row, col)}
                >
                  {number && <span className="xw-num">{number}</span>}
                  <span className="xw-letter">{state.cells[row][col]}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="xw-cluebar">
        <button type="button" className="xw-arrow" onClick={() => stepClue(-1)}>
          ‹
        </button>
        <div className="xw-clue-text">
          <strong>
            {activeClue.number}
            {activeClue.direction === 'across' ? 'A' : 'D'}
          </strong>
          <span>{activeClue.text}</span>
        </div>
        <button type="button" className="xw-arrow" onClick={() => stepClue(1)}>
          ›
        </button>
      </div>

      {/* Hidden input keeps the mobile keyboard open while playing. */}
      {!state.finished && (
        <input
          className="xw-hidden-input"
          value=""
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Type a letter"
          onChange={(e) => {
            const letter = e.target.value.slice(-1).toUpperCase()
            if (/^[A-Z]$/.test(letter)) typeLetter(letter)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') backspace()
          }}
        />
      )}

      <div className="xw-clue-list">
        {(['across', 'down'] as Direction[]).map((dir) => (
          <div key={dir}>
            <h3>{dir === 'across' ? 'Across' : 'Down'}</h3>
            <ul>
              {CLUES.filter((c) => c.direction === dir).map((clue) => (
                <li key={`${clue.number}-${clue.direction}`}>
                  <button
                    type="button"
                    className={
                      activeClue.number === clue.number &&
                      activeClue.direction === clue.direction
                        ? 'is-active'
                        : ''
                    }
                    onClick={() => {
                      setDirection(clue.direction)
                      setCursor([clue.row, clue.col])
                    }}
                  >
                    <b>{clue.number}</b> {clue.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {!state.finished && (
        <div className="xw-actions">
          <button type="button" className="btn btn-ghost" onClick={check}>
            Check
          </button>
          <button type="button" className="btn btn-ghost" onClick={reveal}>
            Reveal answers
          </button>
        </div>
      )}

      {state.finished && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowSummary(true)}
        >
          See results
        </button>
      )}

      <Toast message={message} />

      <Modal open={showHelp} title="How to play" onClose={() => setShowHelp(false)}>
        <ul>
          <li>Tap a square to start typing; tap it again to switch direction.</li>
          <li>Arrow keys move around, space bar flips across/down.</li>
          <li>The timer stops as soon as the grid is correct.</li>
        </ul>
      </Modal>

      <Modal
        open={showSummary}
        title={state.revealed ? 'Answers revealed 🪔' : 'Solved it! 🎉'}
        onClose={() => setShowSummary(false)}
      >
        <p className="xw-summary-time">
          {state.revealed
            ? 'Come back and try the next one unaided!'
            : `Finished in ${formatTime(state.seconds)}`}
        </p>
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
