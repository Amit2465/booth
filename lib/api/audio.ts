// Audio API functions - Ready for real API integration

export interface AudioUploadResponse {
  success: boolean
  audio_id: string
  transcript?: string
  duration: number
}

// Upload audio via WebSocket
export async function uploadAudio(sessionId: string, audioBlob: Blob): Promise<AudioUploadResponse> {
  // TODO: Replace with actual WebSocket implementation
  // return new Promise((resolve, reject) => {
  //   const ws = new WebSocket("ws://13.203.102.165:8080/v1/audio/ws/client")

  //   ws.onopen = () => {
  //     // Send session ID first
  //     ws.send(JSON.stringify({ session_id: sessionId }))
  //     // Send audio data
  //     ws.send(audioBlob)
  //   }

  //   ws.onmessage = (event) => {
  //     const response = JSON.parse(event.data)
  //     ws.close()
  //     resolve(response)
  //   }

  //   ws.onerror = (error) => {
  //     ws.close()
  //     reject(new Error("WebSocket upload failed"))
  //   }

  //   ws.onclose = (event) => {
  //     if (event.code !== 1000) {
  //       reject(new Error("WebSocket connection closed unexpectedly"))
  //     }
  //   }
  // })

  // For now, use HTTP upload as fallback
  return uploadAudioHTTP(sessionId, audioBlob)
}

// Alternative HTTP upload method (if WebSocket is not preferred)
export async function uploadAudioHTTP(sessionId: string, audioBlob: Blob): Promise<AudioUploadResponse> {
  const formData = new FormData()
  formData.append("session_id", sessionId)
  formData.append("audio", audioBlob, "recording.webm")

  const response = await fetch("http://13.203.102.165:8080/v1/audio/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Audio upload failed")
  }

  return await response.json()
}
