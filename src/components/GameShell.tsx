import type { ReactNode } from 'react'
import './GameShell.css'

type GameShellProps = {
  title: string
  icon: string
  onBack: () => void
  onHelp?: () => void
  children: ReactNode
}

export function GameShell({
  title,
  icon,
  onBack,
  onHelp,
  children,
}: GameShellProps) {
  return (
    <div className="game-shell">
      <header className="game-head">
        <button type="button" className="icon-btn" onClick={onBack}>
          ← <span className="icon-btn-label">Games</span>
        </button>
        <h1>
          <span aria-hidden="true">{icon}</span> {title}
        </h1>
        {onHelp ? (
          <button
            type="button"
            className="icon-btn"
            onClick={onHelp}
            aria-label="How to play"
          >
            ?
          </button>
        ) : (
          <span className="icon-btn-spacer" />
        )}
      </header>
      <main className="game-body">{children}</main>
    </div>
  )
}
