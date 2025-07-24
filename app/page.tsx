"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WelcomeScreen } from "@/components/welcome-screen"
import { SessionScreen } from "@/components/session-screen"
import { CameraCapture } from "@/components/camera-capture"
import { AudioRecorder } from "@/components/audio-recorder"
import { SessionHistory } from "@/components/session-history"
import { ProfileView } from "@/components/profile-view"
import { useSession } from "@/hooks/use-session"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { LoadingScreen } from "@/components/loading-screen"

type AppScreen = "loading" | "welcome" | "session" | "camera" | "audio" | "history" | "profile"

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("loading")
  const { sessionId, startSession, endSession, isLoading } = useSession()
  const { toast } = useToast()

  useEffect(() => {
    const initializeApp = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      if (sessionId) {
        setCurrentScreen("session")
      } else {
        setCurrentScreen("welcome")
      }
    }
    initializeApp()
  }, [sessionId])

  const handleStartSession = async () => {
    try {
      await startSession()
      setCurrentScreen("session")
    } catch (error) {
      console.error("Failed to start session:", error)
    }
  }

  const handleEndSession = async () => {
    try {
      await endSession()
      setCurrentScreen("welcome")
    } catch (error) {
      console.error("Failed to end session properly:", error)
    }
  }

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        {currentScreen === "loading" && (
          <motion.div
            key="loading"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <LoadingScreen />
          </motion.div>
        )}

        {currentScreen === "welcome" && (
          <motion.div
            key="welcome"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <WelcomeScreen
              onStartSession={handleStartSession}
              onViewHistory={() => setCurrentScreen("history")}
              isLoading={isLoading}
            />
          </motion.div>
        )}

        {currentScreen === "session" && sessionId && (
          <motion.div
            key="session"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <SessionScreen
              sessionId={sessionId}
              onScanCard={() => setCurrentScreen("camera")}
              onRecordAudio={() => setCurrentScreen("audio")}
              onEndSession={handleEndSession}
              onViewHistory={() => setCurrentScreen("history")}
              onViewProfile={() => setCurrentScreen("profile")}
            />
          </motion.div>
        )}

        {currentScreen === "camera" && sessionId && (
          <motion.div
            key="camera"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <CameraCapture
              sessionId={sessionId}
              onBack={() => setCurrentScreen("session")}
              onSuccess={() => {
                setCurrentScreen("session")
              }}
            />
          </motion.div>
        )}

        {currentScreen === "audio" && sessionId && (
          <motion.div
            key="audio"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <AudioRecorder
              sessionId={sessionId}
              onBack={() => setCurrentScreen("session")}
              onSuccess={() => {
                setCurrentScreen("session")
              }}
            />
          </motion.div>
        )}

        {currentScreen === "history" && (
          <motion.div
            key="history"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <SessionHistory onBack={() => setCurrentScreen(sessionId ? "session" : "welcome")} />
          </motion.div>
        )}
        
        {currentScreen === "profile" && sessionId && (
          <motion.div
            key="profile"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ProfileView 
              sessionId={sessionId}
              onBack={() => setCurrentScreen("session")}
              onEndSession={handleEndSession}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster />
    </div>
  )
}
