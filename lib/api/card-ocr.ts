// Card OCR API functions - Ready for real API integration

export interface CardOCRRequest {
  session_id: string
  image: File | Blob
}

export interface CardOCRResponse {
  success: boolean
  extracted_data?: {
    name?: string
    company?: string
    email?: string
    phone?: string
    address?: string
  }
  confidence_score?: number
  error?: string
}

// Upload and process business card
export async function uploadCardForOCR(sessionId: string, imageBlob: Blob): Promise<CardOCRResponse> {
  try {
    const formData = new FormData()
    formData.append("session_id", sessionId)
    formData.append("file", imageBlob, "card.jpg")

    const response = await fetch("https://amit.heyvalsad.online/v1/card/ocr", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OCR processing failed: ${response.status} ${errorText}`)
    }

    const result = await response.json()

    if (result && typeof result === 'object') {
      return {
        success: true,
        ...result
      }
    } else {
      throw new Error("Invalid OCR response format")
    }
  } catch (error) {
    console.error("Card OCR upload error:", error)
    throw error
  }
}
