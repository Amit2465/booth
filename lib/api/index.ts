// API configuration and utilities

export const API_CONFIG = {
  BASE_URL: "http://13.203.102.165:8080",
  WEBSOCKET_URL: "ws://13.203.102.165:8080",
  ENDPOINTS: {
    SESSIONS: "/v1/sessions/",
    CARD_OCR: "/v1/card/ocr",
    DEEPGRAM: "/v1/deepgram/",
    EMAIL: "/v1/email/",
    EMAIL_SEND: "/v1/email/send",
    LEADS: "/v1/leads",
  },
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
}

// Generic API error class
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message)
    this.name = "APIError"
  }
}

// Generic fetch wrapper with error handling
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, defaultOptions)

    if (!response.ok) {
      throw new APIError(`API request failed: ${response.statusText}`, response.status)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Utility to check if we're in mock mode
export const IS_MOCK_MODE = false // Using real APIs

// Mock mode indicator for development
export function logMockMode(operation: string) {
  if (IS_MOCK_MODE) {
    console.log(`🔧 MOCK MODE: ${operation}`)
  }
}

// Export all API modules
export * from "./sessions"
export * from "./card-ocr"
export * from "./deepgram"
export * from "./email"
