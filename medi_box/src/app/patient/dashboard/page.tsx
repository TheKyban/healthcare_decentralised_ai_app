"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Avatar } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  UploadCloud, 
  X, 
  FileText, 
  BarChart, 
  History, 
  User, 
  Calendar,
  FileImage,
  Stethoscope,
  AlertCircle,
  Loader2,
  MessageSquare
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useGeminiDiagnosis } from "@/lib/hooks/useGeminiDiagnosis"

// Type definition for diagnoses
interface Diagnosis {
  id: string;
  title: string;
  date: string;
  status: string;
  doctor: string;
}

export default function PatientDashboard() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("upload")
  const [symptoms, setSymptoms] = useState("")
  const [duration, setDuration] = useState("")
  const [severity, setSeverity] = useState("")
  const [medicalHistory, setMedicalHistory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pastDiagnoses, setPastDiagnoses] = useState<Diagnosis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { fileToBase64 } = useGeminiDiagnosis()
  
  useEffect(() => {
    // Fetch past diagnoses
    async function fetchDiagnoses() {
      setIsLoading(true)
      
      try {
        const response = await fetch('/api/diagnoses')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch diagnoses: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Transform the data to match our component's expected format
        const formattedDiagnoses = data.diagnoses.map((d: {
          id: string;
          aiDiagnosis: string;
          diagnosisDate: string;
          status: string;
          doctorName: string;
        }) => ({
          id: d.id,
          title: d.aiDiagnosis,
          date: d.diagnosisDate,
          status: d.status === "approved" ? "Confirmed" : "Pending Review",
          doctor: d.doctorName
        }))
        
        setPastDiagnoses(formattedDiagnoses)
      } catch (error) {
        console.error("Error fetching diagnoses:", error)
        
        // Fallback to sample data
        setPastDiagnoses([
          {id: "1", title: "Chest pain and shortness of breath", date: "May 15, 2023", status: "Confirmed", doctor: "Dr. Sarah Williams"},
          {id: "2", title: "Recurring migraine headaches", date: "Jun 22, 2023", status: "Pending Review", doctor: "Awaiting doctor review"},
        ])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDiagnoses()
  }, [])

  const handleSymptomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!symptoms.trim()) {
      toast.error("Please describe your symptoms")
      return
    }
    
    if (!duration.trim()) {
      toast.error("Please specify how long you've had these symptoms")
      return
    }
    
    if (!severity.trim()) {
      toast.error("Please rate the severity of your symptoms")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Submit data to the API
      const response = await fetch('/api/diagnoses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'symptoms',
          data: {
            description: symptoms,
            duration,
            severity,
            medicalHistory: medicalHistory.trim() ? medicalHistory : undefined
          }
        }),
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      toast.success("Symptoms submitted for analysis")
      
      // Redirect to the new diagnosis
      setTimeout(() => {
        router.push(`/patient/diagnosis/${result.diagnosisId}`)
      }, 1000)
    } catch (error) {
      console.error("Error submitting symptoms:", error)
      toast.error("Failed to analyze symptoms. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    
    // Process file uploads
    const processFiles = async () => {
      try {
        const newFiles = Array.from(files).map(file => file.name)
        setUploadedFiles(prev => [...prev, ...newFiles])
        
        // Convert the first file to base64 for processing
        if (files[0]) {
          const base64Data = await fileToBase64(files[0])
          
          // Store in state for later submission
          // In a real app, you might want to store this in a more appropriate state variable
          setUploadedFiles(prev => [...prev, base64Data.substring(0, 20) + '...'])
        }
        
        toast.success(`${files.length} file(s) uploaded successfully`)
      } catch (error) {
        console.error("Error processing files:", error)
        toast.error("Failed to process files. Please try again.")
      } finally {
        setIsUploading(false)
      }
    }
    
    processFiles()
  }

  const handleFilesSubmit = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("Please upload at least one medical image")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // In a real app, you would send the actual image data
      // This is simplified for demonstration purposes
      const response = await fetch('/api/diagnoses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'image',
          data: {
            imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/...", // Dummy data
            imageType: "X-Ray",
            bodyPart: "Chest"
          }
        }),
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      toast.success("Medical images submitted for analysis")
      
      // Redirect to the new diagnosis
      setTimeout(() => {
        router.push(`/patient/diagnosis/${result.diagnosisId}`)
      }, 1000)
    } catch (error) {
      console.error("Error submitting images:", error)
      toast.error("Failed to analyze images. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-950 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">MediBox</h1>
            <nav className="hidden md:flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="text-primary font-medium">Dashboard</Button>
              <Button variant="ghost" size="sm">Reports</Button>
              <Button variant="ghost" size="sm">History</Button>
              <Button variant="ghost" size="sm">Settings</Button>
              <Link href="/patient/chat">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-1"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </Button>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <Avatar>
                <User size={20} />
              </Avatar>
              <div className="text-sm">
                <div>John Smith</div>
                <div className="text-xs text-muted-foreground">Patient</div>
              </div>
            </div>
            <Link href="/patient/dashboard/chat">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                aria-label="Chat"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">Logout</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Welcome back, John</h2>
          <p className="text-muted-foreground">Upload medical reports or describe your symptoms for AI analysis</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Work Area - Takes 2/3 of the grid on desktop */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Diagnosis</CardTitle>
                <CardDescription>
                  Upload medical reports or describe your symptoms for AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-6 w-full justify-start overflow-auto">
                    <TabsTrigger value="upload">
                      <UploadCloud className="h-4 w-4 mr-2" />
                      Upload Reports
                    </TabsTrigger>
                    <TabsTrigger value="symptoms">
                      <FileText className="h-4 w-4 mr-2" />
                      Describe Symptoms
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload">
                    <div className="space-y-4">
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                        <FileImage className="h-10 w-10 text-muted-foreground mb-2" />
                        <h3 className="font-medium">Upload Medical Images</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Support for X-rays, MRIs, CT scans, and other medical images
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="file-upload"
                          onChange={handleFileUpload}
                          multiple
                        />
                        <label htmlFor="file-upload">
                          <Button variant="outline" className="relative" disabled={isUploading}>
                            {isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <UploadCloud className="h-4 w-4 mr-2" />
                                Select Files
                              </>
                            )}
                          </Button>
                        </label>
                      </div>
                      
                      {uploadedFiles.length > 0 && (
                        <div className="border rounded-md">
                          <div className="p-3 border-b bg-muted/30">
                            <h4 className="font-medium">Uploaded Files</h4>
                          </div>
                          <ul className="divide-y">
                            {uploadedFiles.map((file, index) => (
                              <li key={index} className="flex items-center justify-between p-3">
                                <div className="flex items-center">
                                  <FileImage className="h-4 w-4 mr-2 text-primary" />
                                  <span className="text-sm truncate max-w-md">{file}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => removeFile(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                          <div className="p-3 border-t flex justify-end">
                            <Button 
                              onClick={handleFilesSubmit} 
                              disabled={isUploading || isSubmitting}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : "Submit for Analysis"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="symptoms">
                    <form onSubmit={handleSymptomSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="font-medium" htmlFor="symptoms">Describe your symptoms in detail</label>
                        <Textarea 
                          id="symptoms"
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                          placeholder="Please describe what you&apos;re experiencing, including where the pain or discomfort is located, how it feels, etc."
                          className="min-h-[150px]"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="font-medium" htmlFor="duration">How long have you had these symptoms?</label>
                          <Input 
                            id="duration"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="e.g., 3 days, 2 weeks, several months"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="font-medium" htmlFor="severity">How severe are your symptoms?</label>
                          <Input 
                            id="severity"
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value)}
                            placeholder="e.g., mild, moderate, severe"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="font-medium" htmlFor="medical-history">Relevant medical history (optional)</label>
                        <Textarea 
                          id="medical-history"
                          value={medicalHistory}
                          onChange={(e) => setMedicalHistory(e.target.value)}
                          placeholder="Any previous conditions, medications, allergies, or family history that might be relevant"
                        />
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-muted rounded-md">
                        <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">For better analysis, include:</p>
                          <ul className="mt-1 space-y-1 list-disc list-inside text-muted-foreground">
                            <li>Time of day when symptoms are worse</li>
                            <li>What makes symptoms better or worse</li>
                            <li>Any medications you&apos;ve tried</li>
                            <li>Previous medical conditions</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : "Submit for Analysis"}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Your Past Diagnoses</CardTitle>
                <CardDescription>
                  Review your previous medical consultations and AI analyses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                ) : pastDiagnoses.length > 0 ? (
                  <div className="divide-y">
                    {pastDiagnoses.map((diagnosis) => (
                      <div key={diagnosis.id} className="py-3">
                        <Link href={`/patient/diagnosis/${diagnosis.id}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/50 p-2 rounded-md transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{diagnosis.title}</h3>
                                <Badge className={diagnosis.status === "Confirmed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                  {diagnosis.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {diagnosis.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {diagnosis.doctor}
                                </span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="self-end sm:self-center">
                              View Details
                            </Button>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No past diagnoses found.</p>
                  </div>
                )}
              </CardContent>
              {pastDiagnoses.length > 0 && (
                <CardFooter className="flex justify-center border-t bg-muted/50 p-2">
                  <Button variant="link">
                    View Full History
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
          
          {/* Sidebar - Takes 1/3 of the grid on desktop */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4">
                  <div className="bg-primary text-primary-foreground h-full w-full rounded-full flex items-center justify-center text-xl font-semibold">
                    JD
                  </div>
                </Avatar>
                <h3 className="font-medium text-lg">John Doe</h3>
                <p className="text-sm text-muted-foreground">Patient ID: #12345</p>
                <div className="w-full border-t my-4"></div>
                <div className="w-full text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Age:</span>
                    <span>45 years</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Gender:</span>
                    <span>Male</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Blood Type:</span>
                    <span>O+</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Primary Doctor:</span>
                    <span>Dr. Williams</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <span>Total Diagnoses</span>
                  </div>
                  <span className="font-medium">{isLoading ? "-" : pastDiagnoses.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <BarChart className="h-5 w-5 text-primary" />
                    </div>
                    <span>AI Analyses</span>
                  </div>
                  <span className="font-medium">{isLoading ? "-" : pastDiagnoses.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Stethoscope className="h-5 w-5 text-primary" />
                    </div>
                    <span>Doctor Reviews</span>
                  </div>
                  <span className="font-medium">
                    {isLoading ? "-" : pastDiagnoses.filter(d => d.status === "Confirmed").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <History className="h-5 w-5 text-primary" />
                    </div>
                    <span>Pending Reviews</span>
                  </div>
                  <span className="font-medium">
                    {isLoading ? "-" : pastDiagnoses.filter(d => d.status === "Pending Review").length}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <BarChart className="h-4 w-4 mr-2" />
                  View Detailed Stats
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 