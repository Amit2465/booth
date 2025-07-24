// Leads and Email API functions

export interface Lead {
  id: string
  session_id: string
  name: string
  image_url: string
  emails: string[]
  phones: string[]
  interest_score: number
  interest_reason: string
  existing_customer: boolean
  parsed_fields: {
    address?: string
    company?: string
    title?: string
    [key: string]: any
  }
  created_at: string
}

export interface EmailTemplate {
  id: string
  session_id: string
  subject: string
  body: string
  email: string
  created_at: string
}

// Get leads by session
export async function getLeadsBySession(sessionId: string): Promise<Lead[]> {
  try {
    const response = await fetch(`http://13.203.102.165:8080/v1/leads?session_id=${sessionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get leads: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Leads retrieval error:", error)
    throw error
  }
}

// Get email template by session ID
export async function getEmailBySession(sessionId: string): Promise<EmailTemplate> {
  try {
    const response = await fetch(`http://13.203.102.165:8080/v1/email/?session_id=${sessionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get email template: ${response.status}`)
    }

    const emailData = await response.json()
    return emailData
  } catch (error) {
    console.error("Error fetching email template:", error)
    throw error
  }
}

// Send email
export async function sendEmail(toEmail: string, subject: string, content: string): Promise<any> {
  try {
    const formData = new URLSearchParams()
    formData.append('to_email', toEmail)
    formData.append('subject', subject)
    formData.append('content', content)

    const response = await fetch(`http://13.203.102.165:8080/v1/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString()
    })

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}
