"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "./auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Loader2, AlertCircle, Shield, Clock, User, Building2, X } from "lucide-react"
import { NetworkTest } from "@/components/debug/network-test"
import { SecurityVerification } from "./security-verification"

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showDebug, setShowDebug] = useState(false)
  const [securityVerified, setSecurityVerified] = useState(false)
  const [securityError, setSecurityError] = useState("")
  const [showErrorPopup, setShowErrorPopup] = useState(false)

  const { login } = useAuth()

  // Show error popup when error changes
  useEffect(() => {
    if (error) {
      setShowErrorPopup(true)
      // Auto-hide popup after 5 seconds
      const timer = setTimeout(() => {
        setShowErrorPopup(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleSecurityVerify = (isValid: boolean) => {
    setSecurityVerified(isValid)
    if (!isValid) {
      setSecurityError("Security verification failed")
    } else {
      setSecurityError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password")
      return
    }

    // Check security verification first
    if (!securityVerified) {
      setSecurityError("Please complete the security verification")
      return
    }

    setIsLoading(true)
    setError("")

    console.log("Login form: Submitting with", { username, password: "***", securityVerified })

    const result = await login(username, password)

    if (!result.success) {
      setError(result.error || "Login failed")
      // Reset security verification on login failure
      setSecurityVerified(false)
    }

    setIsLoading(false)
  }

  const closeErrorPopup = () => {
    setShowErrorPopup(false)
    setError("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      {/* Error Popup Modal */}
      {showErrorPopup && error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Login Error</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeErrorPopup}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 text-center text-lg font-medium">{error}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={closeErrorPopup} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-lg space-y-6">
        {/* Header with Logo */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-900 rounded-xl shadow-lg">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Library Management System</h1>
            <p className="text-gray-600 mt-2">Institutional Access Portal</p>
          </div>
        </div>

        <Card className="shadow-lg border-gray-200">
          <CardHeader className="text-center pb-6 bg-gray-50 rounded-t-lg">
            <CardTitle className="text-xl font-semibold text-gray-900">User Authentication</CardTitle>
            <CardDescription className="text-gray-600">
              Please enter your credentials to access the library system
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Enter your username"
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Enter your password"
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Security Verification Component */}
              <div className="border-t border-gray-200 pt-6">
                <SecurityVerification onVerify={handleSecurityVerify} disabled={isLoading} />
                {securityError && (
                  <Alert variant="destructive" className="mt-3">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>{securityError}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Inline Error Display (in addition to popup) */}
              {error && !showErrorPopup && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-medium"
                disabled={isLoading || !securityVerified}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-5 w-5" />
                    Sign In
                  </>
                )}
              </Button>

              {/* Session Information */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-900 mb-3">
                  <Clock className="h-4 w-4" />
                  <span>Session Information</span>
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Session duration: 10 minutes</li>
                  <li>• Automatic logout on inactivity</li>
                  <li>• Secure session management</li>
                </ul>
              </div>

              {/* Security Notice */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 pt-2">
                <Shield className="h-4 w-4" />
                <span>Secure Authentication System</span>
                {securityVerified && <span className="text-green-700 font-medium">✓ Verified</span>}
              </div>
            </form>

            {/* Development Credentials */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="h-4 w-4" />
                  <span>Authentication Notice</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="text-red-600 font-medium">Important: Please use your actual library credentials.</p>
                  <p>The system uses HTTP Basic Authentication for author and book data access.</p>
                  <p>Your username and password will be used for API authentication.</p>
                  <p>
                    <strong>Test Username:</strong> Alana Rivers
                  </p>
                  <p>
                    <strong>Test Password:</strong> a
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)} className="mt-3 text-sm">
                  {showDebug ? "Hide" : "Show"} System Diagnostics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {showDebug && <NetworkTest />}
      </div>
    </div>
  )
}
