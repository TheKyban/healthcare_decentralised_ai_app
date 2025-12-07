"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

// Type definition for diagnosis data
interface DiagnosisData {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  dateSubmitted: string;
  type: string;
  aiDiagnosis: string;
  confidence: number;
  status: string;
  symptoms: string;
  medicalHistory: string;
  imageSrc: string;
  aiResponse?: {
    fullText: string;
    sections: string[];
  };
}

export default function DiagnosisDetail() {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const [feedback, setFeedback] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [dialogAction, setDialogAction] = useState<"approve" | "reject">("approve")
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDiagnosisData() {
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch diagnosis data from the API
        const response = await fetch(`/api/diagnoses/${id}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch diagnosis: ${response.statusText}`)
        }
        
        const data = await response.json()
        setDiagnosisData(data)
      } catch (err) {
        console.error("Error fetching diagnosis:", err)
        setError(err instanceof Error ? err.message : "Failed to load diagnosis data")
        
        // Fallback to sample data for demonstration
        setDiagnosisData({
          id: id as string,
          patientName: "John Doe",
          patientAge: 45,
          patientGender: "Male",
          dateSubmitted: "2023-05-10",
          type: "X-Ray Analysis",
          aiDiagnosis: "Possible pneumonia",
          confidence: 87,
          status: "pending",
          symptoms: "Persistent cough for 10 days, fever, chest pain, difficulty breathing",
          medicalHistory: "Smoker (15 years), previous bronchitis (2020)",
          imageSrc: "/xray-sample.jpg"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDiagnosisData()
  }, [id])

  const handleAction = (action: "approve" | "reject") => {
    setDialogAction(action)
    setShowConfirmDialog(true)
  }

  const confirmAction = async () => {
    if (!diagnosisData) return
    
    setIsSubmitting(true)
    
    try {
      // In a real app, this would update the database with the doctor's feedback
      const response = await fetch(`/api/diagnoses/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: dialogAction,
          feedback,
          doctorName: "Dr. Sarah Williams", // In a real app, this would come from the doctor's session
        }),
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }
      
      // Show success message
      if (dialogAction === "approve") {
        toast.success("Diagnosis approved and feedback sent to patient")
      } else {
        toast.success("Diagnosis rejected with your feedback")
      }
      
      // Close dialog and redirect after a short delay
      setShowConfirmDialog(false)
      setTimeout(() => {
        router.push("/doctor/dashboard")
      }, 1500)
    } catch (error) {
      console.error("Error updating diagnosis:", error)
      toast.error(`Failed to ${dialogAction} diagnosis. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-lg font-medium">Loading diagnosis information...</p>
        </div>
      </div>
    )
  }

  if (error || !diagnosisData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="max-w-md mx-auto bg-white dark:bg-slate-950 rounded-lg shadow p-6">
          <h1 className="text-xl font-bold text-red-600 mb-4">Error Loading Diagnosis</h1>
          <p className="mb-4">{error || "Unable to load diagnosis data"}</p>
          <Button onClick={() => router.push("/doctor/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-4">
          <Link href="/doctor/dashboard">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Diagnosis Review #{id}</h1>
            <p className="text-muted-foreground">Patient: {diagnosisData.patientName}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                  <dd className="mt-1">{diagnosisData.patientName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Age</dt>
                  <dd className="mt-1">{diagnosisData.patientAge}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Gender</dt>
                  <dd className="mt-1">{diagnosisData.patientGender}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Date Submitted</dt>
                  <dd className="mt-1">{diagnosisData.dateSubmitted}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Symptoms & Medical History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Reported Symptoms</h3>
                  <p>{diagnosisData.symptoms}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Medical History</h3>
                  <p>{diagnosisData.medicalHistory}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {diagnosisData.aiResponse && (
            <Card>
              <CardHeader>
                <CardTitle>AI Response Details</CardTitle>
                <CardDescription>Full analysis from the AI model</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {diagnosisData.aiResponse.sections.map((section, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <p>{section}</p>
                      {index < diagnosisData.aiResponse!.sections.length - 1 && (
                        <hr className="my-3" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>AI Diagnosis</CardTitle>
                <Badge className="bg-primary/20 text-primary">
                  {diagnosisData.confidence}% Confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium">{diagnosisData.aiDiagnosis}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on {diagnosisData.type}
                  </p>
                </div>
                <div className="rounded-lg border overflow-hidden">
                  <div className="relative aspect-video">
                    {diagnosisData.imageSrc ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        {/* In a real app, this would be the actual image from the database */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-muted-foreground">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <path d="m21 15-5-5L5 21"></path>
                        </svg>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <p className="text-muted-foreground text-sm">No image available</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-muted/50">
                    <p className="text-sm font-medium">
                      {diagnosisData.imageSrc 
                        ? "Medical image with AI analysis overlay" 
                        : "Text-based analysis only"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {diagnosisData.imageSrc 
                        ? "Red areas indicate regions of interest for the diagnosis"
                        : "Based on symptom description provided by patient"}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">AI Explanation</h3>
                  <p className="text-sm">
                    {diagnosisData.aiResponse ? 
                      (diagnosisData.aiResponse.sections[0] || "No detailed explanation available").substring(0, 250) + "..." 
                      : "The model identified patterns in the patient data that are consistent with the diagnosis. This preliminary assessment requires your medical validation."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Medical Opinion</CardTitle>
              <CardDescription>
                Provide your feedback on the AI diagnosis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Enter your medical opinion and any treatment recommendations..."
                className="min-h-[150px]"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => handleAction("reject")}
                disabled={isSubmitting}
              >
                Reject Diagnosis
              </Button>
              <Button 
                onClick={() => handleAction("approve")}
                disabled={isSubmitting}
              >
                Approve Diagnosis
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve" ? "Approve Diagnosis" : "Reject Diagnosis"}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "approve" 
                ? "Are you sure you want to approve this AI diagnosis?" 
                : "Are you sure you want to reject this AI diagnosis?"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              Your feedback will be recorded on the blockchain and shared with the patient.
            </p>
            {feedback ? (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">Your feedback:</p>
                <p className="text-sm mt-1">{feedback}</p>
              </div>
            ) : (
              <p className="text-sm text-yellow-500 mt-2">
                Warning: You haven&apos;t provided any feedback yet.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant={dialogAction === "approve" ? "default" : "destructive"}
              onClick={confirmAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm ${dialogAction === "approve" ? "Approval" : "Rejection"}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 