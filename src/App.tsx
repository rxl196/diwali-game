import { useCallback, useEffect, useState } from 'react'
import { Modal } from './components/Modal'
import { Toast } from './components/Toast'
import { useToast } from './components/useToast'
import { Connections } from './games/connections/Connections'
import { Crossword } from './games/crossword/Crossword'
import { Diyadle } from './games/diyadle/Diyadle'
import { copyToClipboard } from './lib/clipboard'
import { buildShareText, playedCount, shareUrl } from './lib/share'
import { loadResults, resetAll } from './lib/storage'
import { GAME_META, GAME_ORDER } from './lib/types'
import type { GameId, ResultsMap } from './lib/types'
import './App.css'

type View = 'hub' | GameId

function readView(): View {
  const hash = window.location.hash.replace('#/', '').replace('#', '')
  return (GAME_ORDER as string[]).includes(hash) ? (hash as View) : 'hub'
}

export default function App() {
  const [view, setView] = useState<View>(readView)
  const [results, setResults] = useState<ResultsMap>(loadResults)
  const [showShare, setShowShare] = useState(false)
  const { message, show } = useToast()

  useEffect(() => {
    const onHashChange = () => setView(readView())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback((next: View) => {
    window.location.hash = next === 'hub' ? '/' : `/${next}`
    setView(next)
    window.scrollTo(0, 0)
  }, [])

  const refresh = useCallback(() => setResults(loadResults()), [])

  const shareText = buildShareText(results, shareUrl())
  const played = playedCount(results)

  const handleCopy = async () => {
    const ok = await copyToClipboard(shareText)
    show(
      ok ? 'Copied — paste it into Teams!' : 'Copy failed — select the text above',
    )
  }

  if (view === 'crossword') {
    return <Crossword onBack={() => navigate('hub')} onFinish={refresh} />
  }
  if (view === 'connections') {
    return <Connections onBack={() => navigate('hub')} onFinish={refresh} />
  }
  if (view === 'diyadle') {
    return <Diyadle onBack={() => navigate('hub')} onFinish={refresh} />
  }

  return (
    <div className="hub">
      <header className="hub-head">
        <div className="hub-lamps" aria-hidden="true">
          🪔 🪔 🪔
        </div>
        <h1>Diwali Games</h1>
        <p>Three little puzzles to light up your day. Happy Diwali!</p>
      </header>

      <ul className="hub-list">
        {GAME_ORDER.map((game) => {
          const meta = GAME_META[game]
          const result = results[game]
          return (
            <li key={game}>
              <button
                type="button"
                className={`hub-card ${result?.completed ? 'is-done' : ''}`}
                onClick={() => navigate(game)}
              >
                <span className="hub-icon" aria-hidden="true">
                  {meta.icon}
                </span>
                <span className="hub-card-text">
                  <strong>{meta.title}</strong>
                  <span>{meta.tagline}</span>
                </span>
                <span className="hub-status">
                  {result?.completed ? (
                    <span className="hub-badge">
                      {result.solved ? '✅' : '❌'} {result.stat}
                    </span>
                  ) : (
                    <span className="hub-play">Play →</span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="hub-progress">
        <div className="hub-bar">
          <span
            style={{ width: `${(played / GAME_ORDER.length) * 100}%` }}
          />
        </div>
        <p>
          {played} of {GAME_ORDER.length} played
        </p>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={() => setShowShare(true)}
      >
        Share my results
      </button>

      <button
        type="button"
        className="hub-reset"
        onClick={() => {
          resetAll()
          setResults({})
          show('Progress cleared')
        }}
      >
        Reset all progress
      </button>

      <Toast message={message} />

      <Modal
        open={showShare}
        title="Share your results"
        onClose={() => setShowShare(false)}
      >
        <p className="share-hint">
          Copy this and paste it into the Teams channel. The emoji grids show
          your pattern, never the answers.
        </p>
        <textarea className="share-box" readOnly value={shareText} rows={16} />
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={handleCopy}
        >
          Copy to clipboard
        </button>
        {played < GAME_ORDER.length && (
          <p className="share-nudge">
            You still have {GAME_ORDER.length - played} game
            {GAME_ORDER.length - played === 1 ? '' : 's'} to play!
          </p>
        )}
      </Modal>
    </div>
  )
}
