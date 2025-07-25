"use client"

import { CameraIcon, MicrophoneIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

interface WelcomeScreenProps {
  onStartSession: () => void
  isLoading: boolean
}

export function WelcomeScreen({ onStartSession, isLoading }: WelcomeScreenProps) {
  const features = [
    {
      icon: CameraIcon,
      title: "Scan Cards",
      description: "Capture business cards instantly",
    },
    {
      icon: MicrophoneIcon,
      title: "Record Audio",
      description: "Add voice notes to your sessions",
    }
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="pt-8 md:pt-16 pb-8 px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 bg-blue-500 rounded-3xl flex items-center justify-center shadow-lg">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-500 rounded-lg"></div>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Welcome to CardFlow</h1>
          <p className="text-base md:text-lg text-gray-600 max-w-sm mx-auto leading-relaxed">
            Capture business cards and record voice notes in organized sessions
          </p>
        </motion.div>
      </div>

      {/* Features */}
      <div className="px-4 md:px-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1, ease: "easeOut" }}
            >
              <Card className="h-full">
                <CardContent className="p-4 md:p-6">
                  <feature.icon className="w-6 h-6 md:w-8 md:h-8 text-blue-500 mb-3" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Spacer to push footer to bottom */}
      <div className="flex-grow" />

      {/* Footer with Actions and Credits */}
      <div className="w-full py-6 px-4 md:px-6 bg-white border-t mt-auto">
        <div className="max-w-sm mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Button
              onClick={onStartSession}
              disabled={isLoading}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Starting...
                </div>
              ) : (
                "Start Session"
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="pt-4 text-center flex flex-col items-center"
          >
            <p className="text-sm text-gray-500 mb-2">Powered by</p>
            <img
              src="/logo.png"
              alt="Company Logo"
              className="h-10 w-auto object-contain"
              loading="lazy"
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
