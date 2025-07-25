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
    const formData = new FormData()
    formData.append("session_id", sessionId)
    formData.append("audio", audioBlob)

    const response = await fetch("http://amit.heyvalsad.online:8080/v1/deepgram/", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Deepgram processing failed: ${response.status} ${errorText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || "Audio processing failed")
    }

    return result
  } catch (error) {
    console.error("Deepgram upload error:", error)
    throw error
  }
}
