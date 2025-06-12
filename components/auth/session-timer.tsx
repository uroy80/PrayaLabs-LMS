"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "./auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, LogOut, Shield } from "lucide-react"

export function SessionTimer() {
  const { sessionTimeRemaining, logout, user, updateSessionTime } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const SESSION_DURATION = 10 * 60 * 1000 // 10 minutes
  const WARNING_TIME = 2 * 60 * 1000 // 2 minutes

  // Update timer every second for smooth countdown
  useEffect(() => {
    if (!user) {
      // Clear timer if no user
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // Update immediately on mount
    updateSessionTime()

    // Then update every second
    timerRef.current = setInterval(() => {
      updateSessionTime()
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [user]) // Only depend on user, not updateSessionTime to avoid infinite loop

  // Show warning when time is running low
  useEffect(() => {
    if (sessionTimeRemaining <= WARNING_TIME && sessionTimeRemaining > 0) {
      setShowWarning(true)
    } else {
      setShowWarning(false)
    }
  }, [sessionTimeRemaining])

  if (!user || sessionTimeRemaining <= 0) {
    return null
  }

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const progressValue = (sessionTimeRemaining / SESSION_DURATION) * 100

  if (showWarning) {
    return (
      <div className="fixed top-6 right-6 z-50 w-96">
        <Alert variant="destructive" className="border-orange-300 bg-orange-50 shadow-lg">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <AlertDescription>
            <div className="space-y-4">
              <div>
                <div className="font-semibold text-orange-800">Session Expiration Warning</div>
                <div className="text-sm text-orange-700 mt-1">
                  Your session will expire in {formatTime(sessionTimeRemaining)}
                </div>
              </div>
              <Progress value={progressValue} className="h-2 bg-orange-200" />
              <div className="flex gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={logout}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <LogOut className="h-3 w-3 mr-2" />
                  Sign Out Now
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <Shield className="h-4 w-4 text-blue-900" />
          <div>
            <div className="font-medium">Active Session</div>
            <div className="text-xs text-gray-500">Time Remaining: {formatTime(sessionTimeRemaining)}</div>
          </div>
        </div>
        <Progress value={progressValue} className="h-1 mt-3 bg-gray-200" />
      </div>
    </div>
  )
}
