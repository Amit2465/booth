import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const sessionId = formData.get("session_id")
    const image = formData.get("image")
    
    if (!sessionId || !image) {
      return NextResponse.json(
        { success: false, error: "Missing session_id or image" }, 
        { status: 400 }
      )
    }

    // Forward the request to the actual API
    const response = await fetch("http://13.203.102.165:8080/v1/card/ocr", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("External API error:", response.status, errorText)
      throw new Error(`External API error: ${response.status}`)
    }

    const data = await response.json()

    // Ensure the response has the expected format
    if (!data.success) {
      return NextResponse.json({
        success: false,
        error: data.error || "OCR processing failed"
      }, { status: 422 })
    }

    return NextResponse.json({
      success: true,
      card_id: data.card_id || "unknown",
      extracted_data: data.extracted_data || {},
      confidence_score: data.confidence_score || 0
    })
  } catch (error) {
    console.error("OCR processing error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process card" 
      }, 
      { status: 500 }
    )
  }
}
