// Session API functions - Ready for real API integration

export interface CreateSessionResponse {
  session_id: string
  created_at: string
  status: "active" | "completed"
}

export interface UpdateSessionRequest {
  status: "completed"
}

export interface UpdateSessionResponse {
  success: boolean
  session_id: string
  updated_at: string
}

// Create a new session
export async function createSession(): Promise<CreateSessionResponse> {
  const response = await fetch("https://amit.heyvalsad.online/v1/sessions/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to create session")
  }

  return await response.json()
}

// Update session status
export async function updateSession(sessionId: string, data: UpdateSessionRequest): Promise<UpdateSessionResponse> {
  const response = await fetch(`https://amit.heyvalsad.online/v1/sessions/${sessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error("Failed to update session")
  }

  return await response.json()
}

// Get session history
export async function getSessionHistory(): Promise<any[]> {
  const response = await fetch("https://amit.heyvalsad.online/v1/sessions/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch session history")
  }

  const data = await response.json()
  return data
}
