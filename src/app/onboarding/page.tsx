"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { User, Building2, Upload, ArrowRight, ArrowLeft, CheckCircle, PenTool } from "lucide-react"
import { getSessionUser, updateUserProfile, completeOnboarding, createCompany } from "@/lib/storage"

type OnboardingData = {
  name: string
  phone: string
  role: string
  company: string
  companyLogo: string
  profilePicture: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  const [formData, setFormData] = useState<OnboardingData>({
    name: "",
    phone: "",
    role: "",
    company: "",
    companyLogo: "",
    profilePicture: "",
  })

  useEffect(() => {
    const sessionUser = getSessionUser()
    if (!sessionUser) {
      router.push("/login")
      return
    }

    if (sessionUser.onboardingCompleted) {
      router.push("/")
      return
    }

    setUser(sessionUser)
    setFormData((prev) => ({
      ...prev,
      name: sessionUser.name || "",
    }))
  }, [router])

  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding
      setIsLoading(true)

      if (user) {
        const company = createCompany(formData.company, "", user.id)

        await updateUserProfile(user.id, {
          ...formData,
          onboardingCompleted: true,
          currentCompanyId: company.id,
        })
        await completeOnboarding(user.id)
      }

      router.push("/")
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleFileUpload = (field: "profilePicture" | "companyLogo", file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      handleInputChange(field, result)
    }
    reader.readAsDataURL(file)
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() && formData.phone.trim() && formData.role.trim()
      case 2:
        return formData.company.trim()
      case 3:
        return true // Optional step
      default:
        return false
    }
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-xl">
              <PenTool className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Welcome to Pen Master!</CardTitle>
            <CardDescription className="text-base mt-2">
              Let's set up your profile to get started with social media scheduling
            </CardDescription>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Step {currentStep} of {totalSteps}
              </span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tell us about yourself to personalize your experience
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Your Role</Label>
                  <Input
                    id="role"
                    placeholder="e.g., Marketing Manager, Business Owner, Content Creator"
                    value={formData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Help us understand your business for better content suggestions
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="Enter your company name"
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyLogo">Company Logo (Optional)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="companyLogo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload("companyLogo", file)
                      }}
                      className="flex-1"
                    />
                    {formData.companyLogo && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border">
                        <img
                          src={formData.companyLogo || "/placeholder.svg"}
                          alt="Company logo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Upload your company logo to personalize your posts</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                  <Upload className="h-5 w-5" />
                  Profile Picture
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add a profile picture to complete your setup (optional)
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
                    {formData.profilePicture ? (
                      <img
                        src={formData.profilePicture || "/placeholder.svg"}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-gray-400" />
                    )}
                  </div>

                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload("profilePicture", file)
                    }}
                    className="max-w-xs"
                  />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    You're all set!
                  </h4>
                  <p className="text-sm text-green-700">
                    Your profile is ready. You can always update this information later in your profile settings.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button onClick={handleNext} disabled={!isStepValid() || isLoading} className="flex items-center gap-2">
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : currentStep === totalSteps ? (
                <>
                  Complete Setup
                  <CheckCircle className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
