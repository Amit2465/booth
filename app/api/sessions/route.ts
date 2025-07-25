import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Call the actual API endpoint
    const response = await fetch("http://amit.heyvalsad.online:8080/v1/sessions/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to create session")
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Session creation error:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
