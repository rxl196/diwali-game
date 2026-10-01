import type { Tile } from '../../lib/scoring'
import './Keyboard.css'

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

type KeyboardProps = {
  keyStates: Record<string, Tile>
  onKey: (key: string) => void
  disabled: boolean
}

export function Keyboard({ keyStates, onKey, disabled }: KeyboardProps) {
  return (
    <div className="kb" role="group" aria-label="Keyboard">
      {ROWS.map((row, i) => (
        <div className="kb-row" key={row}>
          {i === 2 && (
            <button
              type="button"
              className="kb-key kb-wide"
              onClick={() => onKey('ENTER')}
              disabled={disabled}
            >
              Enter
            </button>
          )}
          {row.split('').map((letter) => (
            <button
              key={letter}
              type="button"
              className={`kb-key ${keyStates[letter] ? `is-${keyStates[letter]}` : ''}`}
              onClick={() => onKey(letter)}
              disabled={disabled}
              aria-label={letter}
            >
              {letter}
            </button>
          ))}
          {i === 2 && (
            <button
              type="button"
              className="kb-key kb-wide"
              onClick={() => onKey('BACKSPACE')}
              disabled={disabled}
              aria-label="Backspace"
            >
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
