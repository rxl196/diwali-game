import { EVENT_NAME } from '../data/puzzleId'
import { GAME_META, GAME_ORDER } from './types'
import type { ResultsMap } from './types'

/**
 * Teams' compose box strips markdown and collapses unusual whitespace, so the
 * summary is plain text with `\n` line breaks and emoji only.
 */
export function buildShareText(results: ResultsMap, url: string): string {
  const lines: string[] = [`🪔 Diwali Games — ${EVENT_NAME} 🪔`, '']

  for (const game of GAME_ORDER) {
    const meta = GAME_META[game]
    const result = results[game]

    if (!result?.completed) {
      lines.push(`${meta.title} — ⬛ not played yet`)
      lines.push('')
      continue
    }

    const status = result.solved ? '✅' : '❌'
    lines.push(`${meta.title} ${result.stat} ${status}`)
    lines.push(...result.grid)
    lines.push('')
  }

  lines.push(`Play: ${url}`)
  return lines.join('\n')
}

export function playedCount(results: ResultsMap): number {
  return GAME_ORDER.filter((game) => results[game]?.completed).length
}

export function shareUrl(): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}`.replace(/index\.html$/, '')
}
