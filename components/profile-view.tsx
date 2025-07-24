"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Mail, Phone, MapPin, Building, User, FileText, ChevronRight, ExternalLink, Loader2, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { getLeadsBySession } from "@/lib/api/leads"
import { getEmailBySession, sendEmail } from "@/lib/api/email"
import { useToast } from "@/hooks/use-toast"
import profileImage from "../public/dp.jpg"

// Data types for API integration
interface Contact {
  id: string
  name: string
  emails: string[]
  phones: string[]
  profileImage?: string
  interestScore: number
  interestReason: string
  address?: string
  company?: string
  createdAt: string
  existingCustomer: boolean
}

interface EmailTemplate {
  id: string
  session_id: string
  subject: string
  body: string
  email: string
  created_at: string
}

interface SessionData {
  id: string
  name: string
  date: string
  contacts: Contact[]
  notes?: string
}

interface ProfileViewProps {
  sessionId: string
  onBack: () => void
  onEndSession: () => void
}

export function ProfileView({ sessionId, onBack, onEndSession }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState("contacts")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate | null>(null)
  const { toast } = useToast()

  // Session data with real contacts from API
  const sessionData: SessionData = {
    id: sessionId,
    name: "Business Meeting",
    date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }),
    contacts: contacts,
    notes: "Follow up with these contacts within 48 hours."
  }
  
  // Load leads (contacts) and email template data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch leads from API
        const leadsData = await getLeadsBySession(sessionId)
        
        // Transform the leads data to match our Contact interface
        const transformedContacts = leadsData.map(lead => ({
          id: lead.id,
          name: lead.name,
          emails: lead.emails,
          phones: lead.phones,
          profileImage: profileImage.src, // Use imported image properly
          interestScore: Math.round(lead.interest_score * 100),
          interestReason: lead.interest_reason,
          address: lead.parsed_fields.address,
          company: lead.parsed_fields.company || 'Unknown',
          createdAt: lead.created_at,
          existingCustomer: lead.existing_customer
        }))
        
        setContacts(transformedContacts)
        
        // Also fetch email template
        try {
          const emailData = await getEmailBySession(sessionId)
          setEmailTemplate(emailData)
        } catch (emailError) {
          console.error("Error fetching email template:", emailError)
        }
      } catch (error) {
        console.error("Error fetching leads:", error)
        toast({
          title: "Error",
          description: "Could not load contact data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    if (sessionId) {
      fetchData()
    }
  }, [sessionId, toast])

  // View contact details
  const viewContact = (contact: Contact) => {
    setSelectedContact(contact)
    
    // Populate default email content from template or create default
    if (contact.emails && contact.emails.length > 0) {
      if (emailTemplate) {
        setEmailSubject(emailTemplate.subject)
        setEmailBody(emailTemplate.body)
      } else {
        setEmailSubject(`Follow-up from ${sessionData.name}`)
        setEmailBody(`Hi ${contact.name},\n\nIt was great meeting you at ${sessionData.name}. I wanted to follow up on our conversation.\n\nBest regards,\n[Your Name]`)
      }
    }
  }

  // Send email handler
  const handleSendEmail = async () => {
    if (!selectedContact?.emails || selectedContact.emails.length === 0) return
    
    setIsSending(true)
    
    try {
      // Call the actual email sending API
      const result = await sendEmail(
        selectedContact.emails[0],
        emailSubject,
        emailBody
      )
      
      if (result.success) {
        setEmailSent(true)
        setTimeout(() => {
          setShowEmailDialog(false)
          setEmailSent(false)
          setIsSending(false)
        }, 2000)
      } else {
        throw new Error("Failed to send email")
      }
    } catch (error) {
      console.error("Error sending email:", error)
      toast({
        title: "Email Failed",
        description: "Could not send the email. Please try again.",
        variant: "destructive",
      })
      setIsSending(false)
    }
  }

  // Calculate interest color
  const getIntentColor = (score: number) => {
    if (score >= 85) return "bg-green-500"
    if (score >= 70) return "bg-amber-500"
    return "bg-gray-400"
  }
  
  // Calculate initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Session Details</h1>
            </div>
            <Button 
              onClick={onEndSession} 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              End Session
            </Button>
          </div>
        </div>
      </div>
      
      {/* Session Summary */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="font-medium text-lg text-gray-900">{sessionData.name}</h2>
          <p className="text-gray-500 text-sm mt-1">{sessionData.date}</p>
          <div className="flex items-center gap-3 mt-4">
            <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
              {sessionData.contacts.length} Contacts
            </div>
            <div className="text-gray-500 text-sm">
              Session ID: {sessionId.substring(0, 8)}...
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mb-8"
        >
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
                <p className="text-gray-500">Loading contacts...</p>
              </div>
            ) : sessionData.contacts.length > 0 ? (
              sessionData.contacts.map((contact) => (
                <Card key={contact.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center">
                        <Avatar className="h-12 w-12 mr-4 bg-blue-100 text-blue-600">
                          {contact.profileImage ? (
                            <img src={contact.profileImage} alt={contact.name} />
                          ) : (
                            <span>{getInitials(contact.name)}</span>
                          )}
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-900">{contact.name}</h3>
                          <div className="flex items-center mt-1">
                            {contact.company && (
                              <span className="text-gray-600 text-sm mr-3 flex items-center">
                                <Building className="h-3.5 w-3.5 mr-1 opacity-70" />
                                {contact.company}
                              </span>
                            )}
                            {contact.emails && contact.emails.length > 0 && (
                              <span className="text-gray-600 text-sm mr-3 hidden sm:flex items-center">
                                <Mail className="h-3.5 w-3.5 mr-1 opacity-70" />
                                {contact.emails[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        {/* Intent Score */}
                        <div className="mr-6 text-center hidden sm:block">
                          <div className="text-xs text-gray-500 mb-1">Interest</div>
                          <div className="flex items-center">
                            <div className={`h-2.5 w-2.5 rounded-full ${getIntentColor(contact.interestScore)} mr-1.5`}></div>
                            <span className="font-medium">{contact.interestScore}%</span>
                          </div>
                        </div>

                        <Button 
                          onClick={() => viewContact(contact)} 
                          variant="ghost" 
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          View
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No contacts yet</h3>
                <p className="text-gray-500 mb-4">Scan business cards to add contacts</p>
              </div>
            )}
          </TabsContent>
          
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="font-medium text-lg mb-4">Session Analytics</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Intent Distribution</h4>
                <div className="h-10 bg-gray-100 rounded-lg overflow-hidden flex">
                  <div className="h-full bg-green-500" style={{ width: '45%' }}></div>
                  <div className="h-full bg-amber-500" style={{ width: '30%' }}></div>
                  <div className="h-full bg-gray-400" style={{ width: '25%' }}></div>
                </div>
                <div className="flex text-xs text-gray-500 mt-2 justify-between">
                  <div>High Intent (85%+): 45%</div>
                  <div>Medium Intent (70-84%): 30%</div>
                  <div>Low Intent (&lt;70%): 25%</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Information Completeness</h4>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <div className="text-xl font-semibold text-gray-900">100%</div>
                    <div className="text-xs text-gray-500">Name</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <div className="text-xl font-semibold text-gray-900">83%</div>
                    <div className="text-xs text-gray-500">Email</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <div className="text-xl font-semibold text-gray-900">67%</div>
                    <div className="text-xs text-gray-500">Phone</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <div className="text-xl font-semibold text-gray-900">33%</div>
                    <div className="text-xs text-gray-500">Address</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Notes Tab */}
          <TabsContent value="notes" className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="font-medium text-lg mb-4">Session Notes</h3>
            <Textarea 
              placeholder="Add notes about this session..."
              className="min-h-[200px]"
              defaultValue={sessionData.notes}
            />
            <div className="mt-4 flex justify-end">
              <Button>Save Notes</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Contact Details Modal */}
      {selectedContact && (
        <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
            <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex items-center">
                <Avatar className="h-16 w-16 mr-4 bg-white/20 text-white border-2 border-white/30">
                  {selectedContact.profileImage ? (
                    <img src={selectedContact.profileImage} alt={selectedContact.name} />
                  ) : (
                    <span className="text-xl">{getInitials(selectedContact.name)}</span>
                  )}
                </Avatar>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    {selectedContact.name}
                  </DialogTitle>
                  {selectedContact.company && (
                    <p className="text-blue-100 mt-1">{selectedContact.company}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <div className="bg-white/10 px-3 py-1 rounded-full text-sm flex items-center">
                  <div className={`h-2 w-2 rounded-full ${getIntentColor(selectedContact.interestScore)} mr-2`}></div>
                  <span>Interest Score: {selectedContact.interestScore}%</span>
                </div>
                <div className="ml-3 text-blue-100 text-sm">
                  Scanned: {new Date(selectedContact.createdAt).toLocaleDateString()}
                </div>
              </div>
            </DialogHeader>
            
            <div className="p-6">
              <div className="space-y-4">
                {selectedContact.emails && selectedContact.emails.length > 0 && (
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Email</div>
                      <div className="text-gray-900">{selectedContact.emails[0]}</div>
                    </div>
                  </div>
                )}
                
                {selectedContact.phones && selectedContact.phones.length > 0 && (
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Phone</div>
                      <div className="text-gray-900">{selectedContact.phones[0]}</div>
                    </div>
                  </div>
                )}
                
                {selectedContact.address && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Address</div>
                      <div className="text-gray-900">{selectedContact.address}</div>
                    </div>
                  </div>
                )}
                
                {/* Why Interested Section */}
                <div className="mt-8">
                  <h3 className="font-medium text-gray-900 mb-3">Why Interested?</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-gray-700 text-sm">
                      {selectedContact.interestReason || 'Analysis not available.'}
                    </p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="mt-6 flex flex-col gap-3">
                  {selectedContact.emails && selectedContact.emails.length > 0 && (
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setShowEmailDialog(true)}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Email to {selectedContact?.name}</DialogTitle>
          </DialogHeader>
          
          {!emailSent ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">To</label>
                <Input value={selectedContact?.emails?.[0] || ''} readOnly className="bg-gray-50" />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <Input 
                  value={emailSubject} 
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <Textarea 
                  value={emailBody} 
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={8}
                  placeholder="Type your message here"
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
                <Button 
                  onClick={handleSendEmail} 
                  disabled={isSending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Email
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Email Sent!</h3>
              <p className="text-gray-500">Your email to {selectedContact?.name} has been sent successfully.</p>
              
              <Button 
                onClick={() => {
                  setShowEmailDialog(false)
                  setEmailSent(false)
                }}
                className="mt-6"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
