"use client"

import { AuthProvider } from "@/components/auth/auth-context"
import { LoginForm } from "@/components/auth/login-form"
import { Dashboard } from "@/components/dashboard/dashboard"
import { SessionTimer } from "@/components/auth/session-timer"
import { useAuth } from "@/components/auth/auth-context"
import { useEffect, useState } from "react"

function AppContent() {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Ensure we're mounted on the client before rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <>
          <Dashboard />
          <SessionTimer />
        </>
      ) : (
        <LoginForm />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
