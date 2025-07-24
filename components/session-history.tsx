"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeftIcon, HistoryIcon, CardIcon, MicrophoneIcon } from "@/components/icons"
import { getSessionHistory } from "@/lib/api/sessions"

interface SessionHistoryProps {
  onBack: () => void
}

interface SessionData {
  id: string
  startTime: string
  endTime?: string
  cardCount: number
  audioCount: number
  status: "active" | "completed"
}

export function SessionHistory({ onBack }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const apiSessions = await getSessionHistory()
        // Map API response to SessionData shape if needed
        const mapped = Array.isArray(apiSessions)
          ? apiSessions.map((s: any) => ({
              id: s.id || s.session_id || s._id || "",
              startTime: s.startTime || s.created_at || s.start_time || "",
              endTime: s.endTime || s.ended_at || s.end_time || undefined,
              cardCount: s.cardCount || s.cards_count || s.card_count || 0,
              audioCount: s.audioCount || s.audio_count || 0,
              status: s.status || "completed",
            }))
          : []
        setSessions(mapped)
      } catch (err: any) {
        setError(err.message || "Failed to load sessions")
      } finally {
        setIsLoading(false)
      }
    }

    loadSessions()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return "Active"

    const startTime = new Date(start)
    const endTime = new Date(end)
    const diffMs = endTime.getTime() - startTime.getTime()
    const diffMins = Math.round(diffMs / (1000 * 60))

    if (diffMins < 60) {
      return `${diffMins}m`
    } else {
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      return `${hours}h ${mins}m`
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="flex items-center justify-between mb-6">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Session History</h1>
          <div className="w-10" />
        </div>

        {/* Loading Skeletons */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-lg p-6 animate-pulse"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-200 rounded w-20" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-16 bg-gray-100 rounded" />
                <div className="h-16 bg-gray-100 rounded" />
                <div className="h-16 bg-gray-100 rounded" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onBack} className="bg-blue-600 text-white">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="flex items-center justify-between mb-6">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Session History</h1>
          <div className="w-10" />
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6"
          >
            <HistoryIcon className="w-12 h-12 text-gray-400" />
          </motion.div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Sessions Yet</h3>
          <p className="text-gray-600 mb-8 max-w-sm">
            Start your first session to capture business cards and record audio notes.
          </p>
          <Button onClick={onBack} className="bg-blue-600 text-white">
            Start New Session
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-6">
        <Button onClick={onBack} variant="ghost" size="sm">
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Session History</h1>
        <div className="w-10" />
      </div>

      <div className="space-y-4">
        {sessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{formatDate(session.startTime)}</h3>
                    <p className="text-sm text-gray-600">
                      {formatTime(session.startTime)} - {session.endTime ? formatTime(session.endTime) : "Active"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{calculateDuration(session.startTime, session.endTime)}</p>
                    <p className="text-xs text-gray-500 capitalize">{session.status}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <CardIcon className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Cards</p>
                      <p className="text-lg font-bold">{session.cardCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <MicrophoneIcon className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Audio</p>
                      <p className="text-lg font-bold">{session.audioCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div
                        className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                          session.status === "active" ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      <p className="text-xs text-gray-600 capitalize">{session.status}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Session ID</span>
                    <span className="text-xs text-gray-700 font-mono">{session.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
