"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera, Check, RotateCcw, Send, SwitchCamera } from "lucide-react"
import { uploadCardForOCR } from "@/lib/api/card-ocr"

interface CameraCaptureProps {
  sessionId: string
  onBack: () => void
  onSuccess: () => void
}

export function CameraCapture({ sessionId, onBack, onSuccess }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [showFlash, setShowFlash] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Check for available cameras
  const getAvailableCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setAvailableCameras(videoDevices)
      if (videoDevices.length > 0 && !currentCameraId) {
        // Prefer back camera if available
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('environment')
        )
        setCurrentCameraId(backCamera?.deviceId || videoDevices[0].deviceId)
      }
    } catch (error) {
      console.error("Error getting camera devices:", error)
    }
  }, [currentCameraId])

  // Defensive: Check for sessionId
  useEffect(() => {
    if (!sessionId) {
      setCameraError("No session found. Please start a new session before scanning cards.")
    }
  }, [sessionId])

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      setIsCameraReady(false)
      
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: window.innerWidth, max: 3840 },
          height: { ideal: window.innerHeight, max: 2160 },
          frameRate: { ideal: 30, max: 30 },
        },
      }

      // Use specific camera if available, otherwise use facingMode
      if (currentCameraId) {
        (constraints.video as MediaTrackConstraints).deviceId = { exact: currentCameraId }
      } else {
        (constraints.video as MediaTrackConstraints).facingMode = facingMode
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true)
          // Ensure video is playing
          if (videoRef.current) {
            videoRef.current.play().catch(console.error)
          }
        }
        
        // Handle video loading errors
        videoRef.current.onerror = (error) => {
          console.error("Video error:", error)
          setCameraError("Failed to load camera stream. Please try again.")
        }
      }
    } catch (error: any) {
      console.error("Camera access error:", error)
      let errorMessage = "Camera access is required to scan cards. Please allow permissions and try again."
      
      if (error.name === 'NotFoundError') {
        errorMessage = "No camera found. Please connect a camera and try again."
      } else if (error.name === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow camera access and try again."
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Camera is being used by another application. Please close other apps and try again."
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = "Camera doesn't support the required settings. Trying with basic settings..."
        // Retry with basic constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode }
          })
          setStream(basicStream)
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream
            videoRef.current.onloadedmetadata = () => setIsCameraReady(true)
          }
          return
        } catch (retryError) {
          console.error("Retry failed:", retryError)
        }
      }
      
      setCameraError(errorMessage)
    }
  }, [stream, facingMode, currentCameraId])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsCameraReady(false)
  }, [stream])

  const switchCamera = useCallback(async () => {
    if (availableCameras.length < 2) {
      return
    }

    // Find next camera
    const currentIndex = availableCameras.findIndex(camera => camera.deviceId === currentCameraId)
    const nextIndex = (currentIndex + 1) % availableCameras.length
    const nextCamera = availableCameras[nextIndex]
    
    setCurrentCameraId(nextCamera.deviceId)
    
    // Update facing mode based on camera label
    if (nextCamera.label.toLowerCase().includes('front') || 
        nextCamera.label.toLowerCase().includes('user')) {
      setFacingMode("user")
    } else {
      setFacingMode("environment")
    }
    
    // Restart camera with new settings
    await startCamera()
  }, [availableCameras, currentCameraId, startCamera])

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady || !sessionId) {
      setCameraError("Camera not ready or session missing. Please try again.")
      return
    }
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    
    if (!context) {
      setCameraError("Failed to access camera context.")
      return
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Clear canvas and draw video frame
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert to blob with high quality
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob)
          setCapturedImage(imageUrl)
          setShowFlash(true)
          setTimeout(() => setShowFlash(false), 200)
          stopCamera()
        } else {
          setCameraError("Failed to capture image from camera.")
        }
      },
      "image/jpeg",
      0.95, // High quality
    )
  }, [stopCamera, isCameraReady, sessionId])

  const retakePhoto = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
      setCapturedImage(null)
    }
    setShowSuccess(false)
    startCamera()
  }, [capturedImage, startCamera])

  const uploadImage = useCallback(async () => {
    if (!capturedImage || !canvasRef.current || !sessionId) {
      setCameraError("No image or session found. Please retake the photo or start a new session.")
      return
    }
    
    setIsUploading(true)
    try {
      const canvas = canvasRef.current
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Failed to create image blob"))
        }, "image/jpeg", 0.95)
      })
      
      const result = await uploadCardForOCR(sessionId, blob)
      
      if (result.success) {
        // Import incrementCardCount here to avoid circular dependencies
        const { incrementCardCount } = await import("@/lib/api/session-stats")
        
        // Increment card count in session stats
        incrementCardCount(sessionId)
        
        setShowSuccess(true)
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        throw new Error("OCR processing failed")
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      setCameraError(error?.message || "Couldn't process the card. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }, [capturedImage, sessionId, onSuccess])

  // Initialize cameras and start camera
  useEffect(() => {
    const initCamera = async () => {
      if (sessionId) {
        await getAvailableCameras()
        await startCamera()
      }
    }
    
    initCamera()
    
    return () => {
      stopCamera()
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage)
      }
    }
  }, [sessionId]) // Only depend on sessionId for initial setup

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage)
      }
    }
  }, [])

  if (cameraError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Camera className="text-red-500 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Error</h3>
          <p className="text-gray-600 mb-6">{cameraError}</p>
          <div className="space-y-3">
            <Button onClick={startCamera} className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl">
              Try Again
            </Button>
            <Button onClick={onBack} variant="outline" className="w-full h-12 rounded-xl border-gray-200">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Flash Effect */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-50"
          />
        )}
      </AnimatePresence>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900/95 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center text-white flex flex-col items-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  delay: 0.2, 
                  type: "spring", 
                  stiffness: 200 
                }}
                className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <motion.div
                  animate={{ 
                    rotate: 360,
                    transition: { 
                      repeat: Infinity, 
                      duration: 2,
                      ease: "linear" 
                    }
                  }}
                  className="w-12 h-12 rounded-full border-2 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent"
                />
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-semibold mb-3"
              >
                Analyzing Card
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-white/90 text-base"
              >
                Extracting contact information...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-40 pt-12 px-6 pb-6 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
        <div className="flex items-center justify-between">
          <Button 
            onClick={onBack} 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20 w-10 h-10 rounded-full p-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-white font-semibold text-lg">Scan Card</h2>
            <p className="text-white/80 text-sm">Position card within the frame</p>
          </div>
          
          {/* Camera Switch Button */}
          {availableCameras.length > 1 && !capturedImage && (
            <Button 
              onClick={switchCamera} 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20 w-10 h-10 rounded-full p-0"
              disabled={!isCameraReady}
            >
              <SwitchCamera className="w-5 h-5" />
            </Button>
          )}
          {availableCameras.length <= 1 && <div className="w-10" />}
        </div>
      </div>

      {/* Camera View */}
      {!capturedImage ? (
        <>
          {/* Full screen video - fixed height/width to cover entire screen */}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="absolute inset-0 min-h-screen min-w-full w-auto h-auto object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
          
          {/* Card Scanning Overlay - Adding a business card frame guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-[90%] max-w-sm aspect-[1.6/1] rounded-lg border-2 border-white/70 overflow-hidden">
              <div className="absolute inset-0 shadow-[0_0_0_1000px_rgba(0,0,0,0.4)]"></div>
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-blue-400"></div>
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-blue-400"></div>
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-blue-400"></div>
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-blue-400"></div>
            </div>
          </div>

          {/* Overlay with better blur effect outside scanning area */}
          <div className="absolute inset-0">
            {/* Card scanning area with mask - this creates a clearer center while blurring outside */}
            <div 
              className="absolute inset-0 backdrop-blur-sm bg-black/40" 
              style={{
                maskImage: 'radial-gradient(ellipse at center, transparent 55%, black 70%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 55%, black 70%)'
              }}
            />
            
            {/* Center card guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-[85%] aspect-[16/10] max-w-md">
                {/* Main scanning frame */}
                <div className="absolute inset-0 border-2 border-white/80 rounded-xl shadow-lg">
                  {/* Animated corner indicators - cleaner design */}
                  <div className="absolute -top-1 -left-1 w-6 h-6">
                    <motion.div 
                      className="absolute top-0 left-0 w-full h-full border-t-2 border-l-2 border-blue-400 rounded-tl"
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6">
                    <motion.div 
                      className="absolute top-0 right-0 w-full h-full border-t-2 border-r-2 border-blue-400 rounded-tr"
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
                    />
                  </div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6">
                    <motion.div 
                      className="absolute bottom-0 left-0 w-full h-full border-b-2 border-l-2 border-blue-400 rounded-bl"
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6">
                    <motion.div 
                      className="absolute bottom-0 right-0 w-full h-full border-b-2 border-r-2 border-blue-400 rounded-br"
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 1.5 }}
                    />
                  </div>

                  {/* Scanning line animation */}
                  <motion.div
                    className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                    animate={{ 
                      y: [10, '95%', 10],
                      opacity: [0.4, 1, 0.4]
                    }}
                    transition={{ 
                      duration: 2.5, 
                      repeat: Number.POSITIVE_INFINITY, 
                      ease: "easeInOut" 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Instruction text */}
          <div className="absolute bottom-72 left-0 right-0 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white text-sm font-medium px-6"
            >
              Align the business card within the frame
            </motion.p>
          </div>

          {/* Camera Status Indicator */}
          {!isCameraReady && (
            <div className="absolute top-24 left-6 right-6 z-30">
              <div className="flex items-center justify-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-yellow-500/90 text-yellow-900 backdrop-blur-sm"
                >
                  Loading Camera...
                </motion.div>
              </div>
            </div>
          )}

          {/* Capture Button - Centered at bottom with better styling */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={captureImage}
              className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl disabled:opacity-50"
              disabled={!isCameraReady || !sessionId || isUploading}
            >
              {/* Pulsing outer ring when ready */}
              {isCameraReady && (
                <motion.div
                  className="absolute inset-0 border-2 border-blue-400 rounded-full"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                />
              )}

              {/* Inner button with improved styling */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCameraReady 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                  : 'bg-gray-400'
              }`}>
                <Camera className="w-7 h-7 text-white" />
              </div>
            </motion.button>
          </div>
        </>
      ) : (
        /* Preview Mode */
        <div className="relative w-full h-full">
          <img src={capturedImage} alt="Captured card" className="w-full h-full object-cover" />

          {/* Preview overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />

          {/* Preview Actions */}
          {!isUploading && !showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-8 left-6 right-6 flex gap-4"
            >
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="flex-1 h-14 bg-white/95 hover:bg-white text-gray-900 border-0 rounded-xl text-base font-medium shadow-lg backdrop-blur-sm"
                disabled={isUploading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button
                onClick={uploadImage}
                disabled={isUploading || !sessionId}
                className="flex-1 h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl text-base font-medium shadow-lg"
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </motion.div>
          )}

          {/* Enhanced Upload Progress */}
          {isUploading && !showSuccess && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center text-white max-w-sm mx-6 p-8 rounded-xl bg-gradient-to-b from-blue-900/30 to-black/30 backdrop-blur-md border border-white/10">
                {/* Enhanced animated OCR scanning effect */}
                <div className="relative mb-8 mx-auto w-32 h-32">
                  {/* Background card */}
                  <div className="absolute inset-0 rounded-md bg-blue-500/10 border border-blue-400/30"></div>
                  
                  {/* Scanning line */}
                  <motion.div 
                    className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  />
                  
                  {/* Animated OCR points */}
                  <motion.div
                    className="absolute w-full h-full"
                    initial={{ opacity: 1 }}
                  >
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full"
                        initial={{ 
                          x: Math.random() * 100 + '%', 
                          y: Math.random() * 100 + '%',
                          opacity: 0
                        }}
                        animate={{ 
                          opacity: [0, 1, 0],
                          scale: [0.8, 1.2, 0.8]
                        }}
                        transition={{
                          duration: 2,
                          delay: i * 0.2,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      />
                    ))}
                  </motion.div>
                  
                  {/* Pulsing circles */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.8, 0.3],
                      rotateZ: [0, 90]
                    }}
                    transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                    className="absolute top-1/2 left-1/2 w-16 h-16 border border-blue-400/50 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                  />
                  <motion.div
                    animate={{ 
                      scale: [1.1, 1, 1.1],
                      opacity: [0.5, 1, 0.5],
                      rotateZ: [0, -90]
                    }}
                    transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
                    className="absolute top-1/2 left-1/2 w-20 h-20 border border-blue-300/30 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                  />
                </div>

                <motion.h3
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className="text-xl font-semibold mb-3"
                >
                  Analyzing Card
                </motion.h3>
                
                {/* Better progress animation */}
                <div className="h-2 bg-blue-900/30 rounded-full mb-4 overflow-hidden">
                  <motion.div
                    initial={{ width: "5%" }}
                    animate={{ width: "95%" }}
                    transition={{ duration: 3 }}
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                  >
                    <motion.div
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                      className="h-full w-1/4 bg-white/30"
                    />
                  </motion.div>
                </div>
                
                <p className="text-white/90 text-sm">
                  Extracting contact information...
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
