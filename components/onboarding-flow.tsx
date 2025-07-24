"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Mic, History, ArrowRight, Check } from "lucide-react"

interface OnboardingFlowProps {
  onComplete: () => void
}

const onboardingSteps = [
  {
    icon: Camera,
    title: "Scan Cards",
    description: "Point your camera at any business card and we'll extract all the important details instantly",
    color: "from-blue-500 to-purple-600",
    bgColor: "from-blue-50 to-purple-50",
  },
  {
    icon: Mic,
    title: "Record Voice Notes",
    description: "Add context with voice recordings that get automatically transcribed for easy searching",
    color: "from-green-500 to-teal-600",
    bgColor: "from-green-50 to-teal-50",
  },
  {
    icon: History,
    title: "Organize Everything",
    description: "All your cards and notes are organized by session, making it easy to find what you need",
    color: "from-orange-500 to-red-600",
    bgColor: "from-orange-50 to-red-50",
  },
]

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const skipOnboarding = () => {
    onComplete()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-teal-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            {onboardingSteps.map((_, index) => (
              <motion.div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index <= currentStep ? "bg-blue-500" : "bg-gray-200"
                }`}
                initial={{ width: 8 }}
                animate={{ width: index === currentStep ? 32 : 8 }}
              />
            ))}
          </div>
        </div>

        {/* Skip button */}
        <div className="flex justify-end mb-4">
          <Button onClick={skipOnboarding} variant="ghost" className="text-gray-500 hover:text-gray-700">
            Skip
          </Button>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Card className={`bg-gradient-to-br ${onboardingSteps[currentStep].bgColor} border-0 shadow-xl`}>
              <CardContent className="p-8 text-center">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="mb-6"
                >
                  <div
                    className={`w-20 h-20 mx-auto bg-gradient-to-br ${onboardingSteps[currentStep].color} rounded-2xl flex items-center justify-center shadow-lg`}
                  >
                    \
                    {onboardingSteps[currentStep].icon &&
                      <onboardingSteps[currentStep].icon className="w-10 h-10 text-white" />}
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-gray-900 mb-4"
                >
                  {onboardingSteps[currentStep].title}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 text-lg leading-relaxed mb-8"
                >
                  {onboardingSteps[currentStep].description}
                </motion.p>

                {/* Action button */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <Button
                    onClick={nextStep}
                    className={`w-full h-14 text-lg font-semibold bg-gradient-to-r ${onboardingSteps[currentStep].color} hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-white border-0`}
                  >
                    {currentStep === onboardingSteps.length - 1 ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Get Started
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Step counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-6 text-gray-500"
        >
          {currentStep + 1} of {onboardingSteps.length}
        </motion.div>
      </div>
    </div>
  )
}
