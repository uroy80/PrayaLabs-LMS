"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, ImageIcon, Calculator } from "lucide-react"
import { Captcha } from "./captcha"
import { MathCaptcha } from "./math-captcha"

interface SecurityVerificationProps {
  onVerify: (isValid: boolean) => void
  disabled?: boolean
}

export function SecurityVerification({ onVerify, disabled = false }: SecurityVerificationProps) {
  const [activeTab, setActiveTab] = useState("image")
  const [imageVerified, setImageVerified] = useState(false)
  const [mathVerified, setMathVerified] = useState(false)

  const handleImageVerify = (isValid: boolean) => {
    setImageVerified(isValid)
    if (isValid) {
      setMathVerified(false) // Reset other verification
    }
    onVerify(isValid)
  }

  const handleMathVerify = (isValid: boolean) => {
    setMathVerified(isValid)
    if (isValid) {
      setImageVerified(false) // Reset other verification
    }
    onVerify(isValid)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-blue-900" />
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-900">Security Verification Required</span>
          {(imageVerified || mathVerified) && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-green-700 font-medium">✓ Verification Complete</span>
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 h-12">
          <TabsTrigger value="image" className="text-sm font-medium flex items-center gap-2 px-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Image</span>
            <span className="sm:hidden">IMG</span>
          </TabsTrigger>
          <TabsTrigger value="math" className="text-sm font-medium flex items-center gap-2 px-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Math</span>
            <span className="sm:hidden">CALC</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="mt-4">
          <Captcha onVerify={handleImageVerify} disabled={disabled} />
        </TabsContent>

        <TabsContent value="math" className="mt-4">
          <MathCaptcha onVerify={handleMathVerify} disabled={disabled} />
        </TabsContent>
      </Tabs>

      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded border">
        <strong>Security Notice:</strong> Complete one verification method above to proceed with authentication. Choose
        between image recognition or mathematical calculation.
      </div>
    </div>
  )
}
