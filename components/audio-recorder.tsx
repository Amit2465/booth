"use client"

import { ArrowLeftIcon, CheckIcon, MicrophoneIcon, PauseIcon, PlayIcon, StopIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { uploadAudioToDeepgram } from "@/lib/api/deepgram"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

interface AudioRecorderProps {
  sessionId: string
  onBack: () => void
  onSuccess: () => void
}

export function AudioRecorder({ sessionId, onBack, onSuccess }: AudioRecorderProps) {
  const router = useRouter()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [waveformData, setWaveformData] = useState<number[]>(new Array(40).fill(0))
  const [showSuccess, setShowSuccess] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  const startMicrophone = useCallback(async () => {
    try {
      setMicError(null)
      // Mobile-optimized audio constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          autoGainControl: true, // Help with varying mobile mic levels
          channelCount: 1, // Mono recording for better compatibility
        },
      })

      streamRef.current = stream

      // Setup audio context for waveform
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)

      analyser.fftSize = 128
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // Setup media recorder
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        setAudioBlob(blob)

        // Create audio URL for playback
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
      }

      mediaRecorderRef.current = mediaRecorder
    } catch (error) {
      console.error("Microphone access error:", error)
      setMicError("Microphone access is required. Please allow permissions and try again.")
    }
  }, [])

  const stopMicrophone = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Convert to normalized values for waveform
    const waveform = Array.from(dataArray.slice(0, 40)).map((value) => value / 255)
    setWaveformData(waveform)

    if (isRecording && !isPaused) {
      animationRef.current = requestAnimationFrame(updateWaveform)
    }
  }, [isRecording, isPaused])

  const startRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return

    setIsRecording(true)
    setIsPaused(false)
    setDuration(0)
    setAudioBlob(null)

    mediaRecorderRef.current.start()

    // Start timer
    intervalRef.current = setInterval(() => {
      setDuration((prev) => prev + 1)
    }, 1000)

    // Start waveform animation
    updateWaveform()
  }, [updateWaveform])

  const pauseRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) return

    if (isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      updateWaveform()
    } else {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRecording, isPaused, updateWaveform])

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) return

    mediaRecorderRef.current.stop()
    setIsRecording(false)
    setIsPaused(false)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [isRecording])

  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioUrl, isPlaying]);

  // Setup audio playback
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    const audio = audioRef.current;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Set the source of the audio element
    audio.src = audioUrl;

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioUrl]);

  const saveRecording = useCallback(async () => {
    if (!audioBlob) return

    setIsUploading(true)

    try {
      // Upload to Deepgram API
      const result = await uploadAudioToDeepgram(sessionId, audioBlob)

      if (result.success) {
        // Import incrementAudioCount here to avoid circular dependencies
        const { incrementAudioCount } = await import("@/lib/api/session-stats")

        // Increment audio count in session stats
        await incrementAudioCount(sessionId)

        // Show success and return to session screen automatically
        setShowSuccess(true)
        setTimeout(() => {
          onSuccess() // This will take user back to session screen
        }, 1500)
      } else {
        throw new Error(result.error || "Audio upload failed")
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "Couldn't save the audio. Please check your connection and try again.",
        variant: "destructive",
      })
      // Navigate to landing page on error after showing toast
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } finally {
      setIsUploading(false)
    }
  }, [audioBlob, sessionId, onSuccess, toast])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Handle audio playback events are already set up in the togglePlayback function
  // and the useEffect hook that follows it, so we don't need this duplicate code
  useEffect(() => {
    // This is handled by the audio player setup we added earlier
    // Just keeping this effect to avoid breaking the component structure
  }, [audioUrl])

  useEffect(() => {
    startMicrophone()
    return () => {
      stopMicrophone()
      // Clean up audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [startMicrophone, stopMicrophone, audioUrl])

  if (micError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MicrophoneIcon className="text-red-600" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Microphone Access Required</h3>
          <p className="text-gray-600 mb-6">{micError}</p>
          <div className="space-y-3">
            <Button
              onClick={startMicrophone}
              className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-2xl"
            >
              Try Again
            </Button>
            <Button onClick={onBack} variant="outline" className="w-full h-12 rounded-2xl bg-transparent">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Add hook for mobile detection
  const isMobile = typeof window !== 'undefined' &&
    (navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPad/i) ||
      navigator.userAgent.match(/iPod/i) ||
      navigator.userAgent.match(/BlackBerry/i) ||
      navigator.userAgent.match(/Windows Phone/i));

  return (
    <div className="min-h-screen bg-white safe-area-inset-bottom">
      {/* Prevent pull-to-refresh on mobile */}
      <style jsx global>{`
        body {
          overscroll-behavior-y: contain;
        }
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        /* Prevent double-tap zoom */
        * { 
          touch-action: manipulation;
        }
      `}</style>
      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-green-500 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center text-white"
            >
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="text-white" size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Audio Saved!</h2>
              <p className="text-white/90">Your recording has been transcribed</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <Button onClick={onBack} variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-full">
          <ArrowLeftIcon className="text-gray-600" size={20} />
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">Voice Recording</h1>
          <p className="text-sm text-gray-600">
            {isRecording ? (isPaused ? "Recording Paused" : "Recording...") : "Ready to record"}
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Recording Interface */}
      <div className="flex flex-col items-center justify-center flex-1 p-6">
        {/* Timer */}
        <div className="text-center mb-8">
          <div className="text-6xl font-mono font-bold text-gray-900 mb-4">{formatTime(duration)}</div>
          <div className="flex items-center justify-center space-x-3">
            <div
              className={`w-4 h-4 rounded-full ${isRecording && !isPaused ? "bg-red-500" : "bg-gray-400"}`}
            />
            <span className="text-sm font-medium text-gray-600">
              {isRecording ? (isPaused ? "PAUSED" : "RECORDING") : "READY"}
            </span>
          </div>
        </div>

        {/* Waveform Visualizer */}
        <Card className="w-full max-w-md mb-8">
          <CardContent className="p-6">
            <div className="h-20 flex items-center justify-center space-x-1">
              {waveformData.map((amplitude, index) => (
                <div
                  key={index}
                  className="w-1 bg-blue-500 rounded-full"
                  style={{
                    height: `${Math.max(4, amplitude * 60)}px`,
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Control Buttons */}
        <div className="flex items-center space-x-6 touch-none">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="w-20 h-20 md:w-24 md:h-24 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-2xl active:transform active:scale-95 transition-transform"
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              <MicrophoneIcon className="w-8 h-8 md:w-10 md:h-10" />
            </Button>
          ) : (
            <div className="flex items-center space-x-4">
              <Button
                onClick={pauseRecording}
                className="w-16 h-16 bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-xl"
              >
                {isPaused ? <PlayIcon className="w-6 h-6" /> : <PauseIcon className="w-6 h-6" />}
              </Button>

              <Button
                onClick={stopRecording}
                className="w-20 h-20 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-2xl"
              >
                <StopIcon className="w-8 h-8" />
              </Button>
            </div>
          )}
        </div>

        {/* Audio Preview & Save Button */}
        {audioBlob && !isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 w-full max-w-md space-y-5"
          >
            {/* Hidden audio element */}
            <audio ref={audioRef} className="hidden" />

            {/* Audio Player */}
            <div className="bg-gray-50 rounded-2xl p-4 flex items-center shadow-sm">
              <Button
                onClick={togglePlayback}
                className={`w-14 h-14 md:w-12 md:h-12 rounded-full flex-shrink-0 active:transform active:scale-95 transition-transform ${isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                  }`}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                {isPlaying ? <PauseIcon className="w-6 h-6 md:w-5 md:h-5" /> : <PlayIcon className="w-6 h-6 md:w-5 md:h-5" />}
              </Button>

              <div className="flex-1 mx-4">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  {audioRef.current && (
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${audioRef.current.duration ? (audioRef.current.currentTime / audioRef.current.duration) * 100 : 0}%`
                      }}
                    />
                  )}
                </div>
              </div>

              <span className="text-sm text-gray-600 font-mono">
                {formatTime(duration)}
              </span>

              {/* Audio element is already defined at the top of this component */}
            </div>

            <Button
              onClick={saveRecording}
              disabled={isUploading}
              className="w-full h-14 text-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-2xl"
            >
              {isUploading ? (
                <div className="flex items-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                  Saving...
                </div>
              ) : (
                "Save Recording"
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
