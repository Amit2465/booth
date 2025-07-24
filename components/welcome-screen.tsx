"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CameraIcon, MicrophoneIcon, HistoryIcon } from "@/components/icons"

interface WelcomeScreenProps {
  onStartSession: () => void
  onViewHistory: () => void
  isLoading: boolean
}

export function WelcomeScreen({ onStartSession, onViewHistory, isLoading }: WelcomeScreenProps) {
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
    <div className="min-h-screen bg-white relative">
      {/* Header */}
      <div className="pt-16 pb-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-blue-500 rounded-3xl flex items-center justify-center shadow-lg">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 bg-blue-500 rounded-lg"></div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome to CardFlow</h1>
          <p className="text-lg text-gray-600 max-w-sm mx-auto leading-relaxed">
            Capture business cards and record voice notes in organized sessions
          </p>
        </motion.div>
      </div>

      {/* Features */}
      <div className="px-6 mb-8">
        <div className="space-y-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
            >
              <Card className="bg-gray-50 border-0 shadow-none">
                <CardContent className="flex items-center p-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mr-4">
                    <feature.icon className="text-gray-700" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      
      {/* Actions */}
      <div className="px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-3"
        >
          <Button
            onClick={onStartSession}
            disabled={isLoading}
            className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Starting...
              </div>
            ) : (
              "Start New Session"
            )}
          </Button>
        </motion.div>
      </div>
      
      {/* Powered By Logo */}
      <div className="absolute bottom-12 left-0 right-0 w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <p className="text-sm text-gray-500 mb-2">Powered By</p>
          <img 
            src="https://framerusercontent.com/images/xxbYPEc0sA0qfo7vi39gn9GnQQ.svg?scale-down-to=512" 
            alt="Powered By Logo" 
            className="h-8 object-contain"
          />
        </motion.div>
      </div>
    </div>
  )
}
