"use client"

import { useState, useCallback } from "react"
import Cookies from "js-cookie"
import { createSession } from "@/lib/api/sessions"

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return Cookies.get("session_id") || null
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(false)

  const startSession = useCallback(async () => {
    setIsLoading(true)
    try {
      // Call the real API to create a session
      const response = await createSession()
      const newSessionId = response.session_id

      setSessionId(newSessionId)
      Cookies.set("session_id", newSessionId, { expires: 1 }) // 1 day expiry
      
      // Initialize session stats for the new session
      const { initSessionStats } = await import("@/lib/api/session-stats")
      initSessionStats(newSessionId)

      return newSessionId
    } catch (error) {
      console.error("Error starting session:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const endSession = useCallback(async () => {
    if (!sessionId) return

    setIsLoading(true)
    try {
      // As per the new requirements, we don't remove the cookie
      // but we should update the session status in the backend
      await new Promise((resolve) => setTimeout(resolve, 500))
      
      // Note: We keep the session ID in cookies so the history remains accessible
      // The session ID will be updated when a new session starts
    } catch (error) {
      console.error("Error ending session:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  return {
    sessionId,
    startSession,
    endSession,
    isLoading,
  }
}
