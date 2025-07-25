// Deepgram API functions for audio transcription and summarization

export interface DeepgramResponse {
  success: boolean
  transcript?: string
  summary?: string
  error?: string
}

// Upload audio for transcription and summarization
export async function uploadAudioToDeepgram(sessionId: string, audioBlob: Blob): Promise<DeepgramResponse> {
  try {
    if (!sessionId) {
      throw new Error("Session ID is required for audio upload")
    }

    // Validate both session_id and audio blob are present
    if (!audioBlob) {
      throw new Error("Audio file is required")
    }

    // Create FormData
    const formData = new FormData()
    formData.append('session_id', sessionId)
    formData.append('audio', audioBlob)

    // Log the request for debugging
    console.log("Sending audio upload request with session:", sessionId, {
      session_id: sessionId,
      audio_size: audioBlob.size
    })

    const response = await fetch("https://amit.heyvalsad.online/v1/deepgram/", {
      method: "POST",
      body: formData,
      // Don't set Content-Type header, let the browser set it with the boundary
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Server Error Response:", errorText)
      throw new Error(`Upload failed: ${response.status} - ${errorText}`)
    }

    const result = await response.json()

    // Log successful response for debugging
    console.log("Audio upload successful:", { success: result.success, sessionId })

    return result
  } catch (error) {
    console.error("Deepgram upload error:", error)
    throw error
  }
}
