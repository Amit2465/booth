// Session stats tracking
import Cookies from "js-cookie"

interface SessionStats {
  cards: number
  audio: number
}

const STATS_COOKIE_KEY = "session_stats"

// Initialize stats for a session
export function initSessionStats(sessionId: string): SessionStats {
  const stats: SessionStats = { cards: 0, audio: 0 }
  saveSessionStats(sessionId, stats)
  return stats
}

// Get stats for the current session
export function getSessionStats(sessionId: string): SessionStats {
  try {
    const statsJson = Cookies.get(`${STATS_COOKIE_KEY}_${sessionId}`)
    if (statsJson) {
      return JSON.parse(statsJson)
    }
  } catch (error) {
    console.error("Error parsing session stats:", error)
  }
  return { cards: 0, audio: 0 }
}

// Save stats for the current session
export function saveSessionStats(sessionId: string, stats: SessionStats): void {
  Cookies.set(`${STATS_COOKIE_KEY}_${sessionId}`, JSON.stringify(stats), { expires: 1 })
}

// Increment card count for the session
export function incrementCardCount(sessionId: string): SessionStats {
  const stats = getSessionStats(sessionId)
  stats.cards += 1
  saveSessionStats(sessionId, stats)
  return stats
}

// Increment audio count for the session
export function incrementAudioCount(sessionId: string): SessionStats {
  const stats = getSessionStats(sessionId)
  stats.audio += 1
  saveSessionStats(sessionId, stats)
  return stats
}
