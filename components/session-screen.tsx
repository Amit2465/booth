"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CameraIcon, MicrophoneIcon, HistoryIcon, CardIcon, XIcon } from "@/components/icons"
import { useState, useEffect } from "react"
import { getSessionStats, initSessionStats } from "@/lib/api/session-stats"

interface SessionScreenProps {
  sessionId: string
  onScanCard: () => void
  onRecordAudio: () => void
  onEndSession: () => void
  onViewHistory: () => void
  onViewProfile?: () => void
}

export function SessionScreen({
  sessionId,
  onScanCard,
  onRecordAudio,
  onEndSession,
  onViewHistory,
  onViewProfile,
}: SessionScreenProps) {
  const [showEndModal, setShowEndModal] = useState(false)
  const [sessionStats, setSessionStats] = useState({ cards: 0, audio: 0 })
  const [sessionTime, setSessionTime] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime((prev) => prev + 1)
    }, 1000)

    // Get real stats from our session stats tracker
    const stats = getSessionStats(sessionId)
    setSessionStats(stats)

    // Setup interval to regularly update stats from cookies
    // This ensures if another component increments the stats, we'll see the update
    const statsRefreshTimer = setInterval(() => {
      const updatedStats = getSessionStats(sessionId)
      setSessionStats(updatedStats)
    }, 2000) // Check every 2 seconds

    return () => {
      clearInterval(timer)
      clearInterval(statsRefreshTimer)
    }
  }, [sessionId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const actions = [
    {
      icon: CameraIcon,
      title: "Scan Business Card",
      description: "Capture and digitize cards",
      action: onScanCard,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      icon: MicrophoneIcon,
      title: "Record Voice Note",
      description: "Add audio to your session",
      action: onRecordAudio,
      color: "bg-green-500 hover:bg-green-600",
    },
  ]
  
  // Add Profile action if available
  if (onViewProfile) {
    actions.push({
      icon: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
      title: "View Profile",
      description: "See contact details",
      action: onViewProfile,
      color: "bg-purple-500 hover:bg-purple-600",
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Active Session</h1>
          <div className="flex items-center mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600 font-mono">{formatTime(sessionTime)}</span>
          </div>
        </div>
        <Button onClick={onViewHistory} variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-full">
          <HistoryIcon className="text-gray-600" size={20} />
        </Button>
      </div>

      {/* Stats */}
      <div className="p-6">
        <Card className="bg-gray-50 border-0 shadow-none">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <CardIcon className="text-blue-600" size={20} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{sessionStats.cards}</div>
                <div className="text-sm text-gray-600">Cards</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <MicrophoneIcon className="text-green-600" size={20} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{sessionStats.audio}</div>
                <div className="text-sm text-gray-600">Audio</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="px-6 space-y-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <Card
              className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={action.action}
            >
              <CardContent className="flex items-center p-4">
                <div
                  className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center mr-4 shadow-lg`}
                >
                  <action.icon className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* End Session */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100">
        <Button
          onClick={() => setShowEndModal(true)}
          variant="outline"
          className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50 rounded-2xl"
        >
          End Session
        </Button>
      </div>

      {/* End Session Modal */}
      <AnimatePresence>
        {showEndModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowEndModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl mx-6 w-full max-w-sm"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">End Session?</h3>
                  <Button
                    onClick={() => setShowEndModal(false)}
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 rounded-full"
                  >
                    <XIcon className="text-gray-500" size={16} />
                  </Button>
                </div>

                <p className="text-gray-600 mb-6">This will save all your captured data and end the current session.</p>

                <div className="flex space-x-3">
                  <Button onClick={() => setShowEndModal(false)} variant="outline" className="flex-1 h-11 rounded-2xl">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowEndModal(false)
                      onEndSession()
                    }}
                    className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white rounded-2xl"
                  >
                    End Session
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
