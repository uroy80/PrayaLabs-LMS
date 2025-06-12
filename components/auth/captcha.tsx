"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, Loader2, Shield } from "lucide-react"

interface CaptchaProps {
  onVerify: (isValid: boolean) => void
  disabled?: boolean
}

export function Captcha({ onVerify, disabled = false }: CaptchaProps) {
  const [captchaId, setCaptchaId] = useState<string>("")
  const [captchaImage, setCaptchaImage] = useState<string>("")
  const [captchaAnswer, setCaptchaAnswer] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string>("")
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    loadCaptcha()
  }, [])

  const loadCaptcha = async () => {
    setLoading(true)
    setError("")
    setCaptchaAnswer("")
    setIsVerified(false)
    onVerify(false)

    try {
      const response = await fetch("/api/captcha")
      const data = await response.json()

      if (response.ok) {
        setCaptchaId(data.id)
        setCaptchaImage(data.svg)
      } else {
        setError("Failed to load CAPTCHA")
      }
    } catch (error) {
      console.error("CAPTCHA load error:", error)
      setError("Failed to load CAPTCHA")
    }

    setLoading(false)
  }

  const verifyCaptcha = async () => {
    if (!captchaAnswer.trim()) {
      setError("Please enter the CAPTCHA code")
      return
    }

    if (captchaAnswer.length < 5) {
      setError("Please enter all 5 characters")
      return
    }

    setVerifying(true)
    setError("")

    try {
      const response = await fetch("/api/captcha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: captchaId,
          answer: captchaAnswer,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.valid) {
          setIsVerified(true)
          setError("")
          onVerify(true)
        } else {
          setError("Incorrect CAPTCHA code. Please try again.")
          setIsVerified(false)
          onVerify(false)
          loadCaptcha() // Load new CAPTCHA
        }
      } else {
        setError(data.error || "CAPTCHA verification failed")
        setIsVerified(false)
        onVerify(false)
        loadCaptcha() // Load new CAPTCHA
      }
    } catch (error) {
      console.error("CAPTCHA verification error:", error)
      setError("CAPTCHA verification failed")
      setIsVerified(false)
      onVerify(false)
    }

    setVerifying(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-blue-900" />
        <Label htmlFor="captcha" className="text-sm font-medium text-gray-900">
          Image Verification
        </Label>
        {isVerified && (
          <span className="text-xs text-green-700 font-medium bg-green-100 px-2 py-1 rounded">✓ Verified</span>
        )}
      </div>

      <Card className="border-2 border-gray-200">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* CAPTCHA Image Display */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                {loading ? (
                  <div className="h-16 bg-gray-100 rounded border flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : captchaImage ? (
                  <div className="relative">
                    <img
                      src={captchaImage || "/placeholder.svg"}
                      alt="Security verification code"
                      className="h-16 w-full object-contain border-2 border-gray-300 rounded bg-white"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                  </div>
                ) : (
                  <div className="h-16 bg-gray-100 rounded border flex items-center justify-center text-sm text-gray-500">
                    Failed to load verification image
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadCaptcha}
                disabled={loading || disabled}
                title="Generate new verification code"
                className="h-16 w-16 flex-shrink-0"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {/* Input and Verification */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="captcha-input" className="text-sm text-gray-700">
                  Enter the 5 characters shown above
                </Label>
                <Input
                  id="captcha-input"
                  type="text"
                  placeholder="Enter verification code"
                  value={captchaAnswer}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().slice(0, 5)
                    setCaptchaAnswer(value)
                    setError("")
                    setIsVerified(false)
                    onVerify(false)
                  }}
                  disabled={disabled || loading}
                  maxLength={5}
                  className="text-center tracking-wider font-mono text-lg h-12 border-2 border-gray-300 focus:border-blue-500"
                  autoComplete="off"
                />
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</div>}

              {isVerified && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Verification successful! You may proceed.
                </div>
              )}

              <Button
                type="button"
                onClick={verifyCaptcha}
                disabled={disabled || loading || verifying || !captchaAnswer.trim() || captchaAnswer.length < 5}
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-medium"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verifying Code...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Verify Security Code
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded border">
        <strong>Security Notice:</strong> Enter the exact characters shown in the image above. The verification is
        case-insensitive.
      </div>
    </div>
  )
}
