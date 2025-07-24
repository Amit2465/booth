// Email API functions

export interface EmailData {
  id: string
  session_id: string
  subject: string
  body: string
  email: string
  created_at: string
}

// Get personalized email by session ID
export async function getEmailBySession(sessionId: string): Promise<EmailData> {
  try {
    const response = await fetch(`http://13.203.102.165:8080/v1/email/?session_id=${sessionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get email: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Email retrieval error:", error)
    throw error
  }
}

// Send email
export async function sendEmail(toEmail: string, subject: string, content: string): Promise<{ success: boolean }> {
  try {
    // Use URLSearchParams for x-www-form-urlencoded data
    const formData = new URLSearchParams()
    formData.append("to_email", toEmail)
    formData.append("subject", subject)
    formData.append("content", content)

    const response = await fetch("http://13.203.102.165:8080/v1/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.status}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Email sending error:", error)
    throw error
  }
}
