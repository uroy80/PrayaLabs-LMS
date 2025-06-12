"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { libraryAPI, ApiError } from "@/lib/api"

// Helper to check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

interface User {
  uid: string
  name: string
  sessionId: string
  loginTime: number
  lastActivity: number
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
  csrfToken: string | null
  sessionTimeRemaining: number
  isSessionExpired: boolean
  updateSessionTime: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Session configuration
const SESSION_DURATION = 10 * 60 * 1000 // 10 minutes in milliseconds
const ACTIVITY_CHECK_INTERVAL = 30 * 1000 // Check every 30 seconds
const SESSION_WARNING_TIME = 2 * 60 * 1000 // Warn 2 minutes before expiry

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0)
  const [isSessionExpired, setIsSessionExpired] = useState(false)

  // Generate unique session ID
  const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  // Clear all stored authentication data
  const clearStoredData = useCallback(() => {
    if (isBrowser) {
      localStorage.removeItem("library_user")
      localStorage.removeItem("library_csrf_token")
      localStorage.removeItem("library_logout_token")
      localStorage.removeItem("library_session_id")
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    console.log("Starting logout process...")

    // Always clear local state and storage first
    setUser(null)
    setCsrfToken(null)
    setSessionTimeRemaining(0)
    setIsSessionExpired(false)
    clearStoredData()

    console.log("Local logout completed")

    // Try server logout in background (don't wait for it)
    if (user?.sessionId) {
      libraryAPI.logout(user.sessionId).catch((error) => {
        console.warn("Background server logout failed (this is OK):", error)
      })
    }
  }, [user?.sessionId, clearStoredData])

  // Update last activity time
  const updateActivity = useCallback(() => {
    if (user && isBrowser) {
      // Instead of updating the entire user object (which causes re-renders),
      // just update the lastActivity in localStorage without changing state
      const updatedUser = {
        ...user,
        lastActivity: Date.now(),
      }

      // Only update localStorage, don't update state on every activity
      localStorage.setItem("library_user", JSON.stringify(updatedUser))

      // We'll only update the state periodically in the session check interval
      // This prevents the infinite loop of state updates
    }
  }, [user])

  // Check session validity
  const isSessionValid = useCallback((userData: User): boolean => {
    const now = Date.now()
    const sessionAge = now - userData.loginTime
    const timeSinceActivity = now - userData.lastActivity

    // Session expires after SESSION_DURATION or if inactive for too long
    return sessionAge < SESSION_DURATION && timeSinceActivity < SESSION_DURATION
  }, [])

  // Update session time remaining (called every second by the timer component)
  const updateSessionTime = useCallback(() => {
    if (user) {
      const now = Date.now()
      const timeLeft = SESSION_DURATION - (now - user.loginTime)
      setSessionTimeRemaining(Math.max(0, timeLeft))

      // Check if session is expired
      if (timeLeft <= 0) {
        setIsSessionExpired(true)
        logout()
      }
    }
  }, [user, logout])

  // Verify session with server (simplified)
  const verifySessionWithServer = useCallback(
    async (sessionId: string) => {
      try {
        // Simplified session verification - just check if we have valid tokens
        const isValid = await libraryAPI.verifySession(sessionId)
        if (!isValid) {
          console.log("Server session invalid, logging out")
          logout()
        }
      } catch (error) {
        console.warn("Could not verify session with server:", error)
        // Don't logout on network errors, but log the issue
      }
    },
    [logout],
  )

  // Session activity check effect (less frequent)
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      // Check if session is expired
      if (!isSessionValid(user)) {
        setIsSessionExpired(true)
        logout()
        return
      }

      // Update user state with the latest activity time from localStorage
      if (isBrowser) {
        const savedUser = localStorage.getItem("library_user")
        if (savedUser) {
          try {
            const userData: User = JSON.parse(savedUser)
            // Only update the state if the lastActivity has changed significantly
            if (Math.abs(userData.lastActivity - user.lastActivity) > 10000) {
              // 10 seconds threshold
              setUser(userData)
            }
          } catch (error) {
            console.error("Error parsing saved user data:", error)
          }
        }
      }

      // Show warning when session is about to expire
      const timeLeft = SESSION_DURATION - (Date.now() - user.loginTime)
      if (timeLeft <= SESSION_WARNING_TIME && timeLeft > 0) {
        console.warn(`Session expires in ${Math.ceil(timeLeft / 60000)} minutes`)
      }
    }, ACTIVITY_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [user, isSessionValid, logout])

  // Activity tracking
  useEffect(() => {
    if (!user || !isBrowser) return

    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    // Use a debounced version of handleActivity to prevent too many updates
    let activityTimeout: NodeJS.Timeout | null = null
    const handleActivity = () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout)
      }

      // Debounce activity updates to once per second
      activityTimeout = setTimeout(() => {
        updateActivity()
      }, 1000)
    }

    // Add activity listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      // Clean up
      if (activityTimeout) {
        clearTimeout(activityTimeout)
      }
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [updateActivity])

  // Check for existing session on load
  useEffect(() => {
    if (isBrowser) {
      const savedUser = localStorage.getItem("library_user")
      const savedToken = localStorage.getItem("library_csrf_token")

      if (savedUser && savedToken) {
        try {
          const userData: User = JSON.parse(savedUser)

          // Validate session
          if (isSessionValid(userData)) {
            setUser(userData)
            setCsrfToken(savedToken)
            setSessionTimeRemaining(SESSION_DURATION - (Date.now() - userData.loginTime))

            // Verify session with server (simplified)
            verifySessionWithServer(userData.sessionId)
          } else {
            // Session expired, clear data
            console.log("Session expired, clearing stored data")
            clearStoredData()
          }
        } catch (error) {
          console.error("Error parsing saved user data:", error)
          clearStoredData()
        }
      }
    }
    setLoading(false)
  }, [isSessionValid, verifySessionWithServer, clearStoredData])

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log("Auth context: Starting login process")
      setLoading(true)

      // Generate new session ID
      const sessionId = generateSessionId()

      // Attempt login
      const data = await libraryAPI.login(username, password, sessionId)

      const userData = data.current_user
      const now = Date.now()

      const userWithSession: User = {
        ...userData,
        sessionId,
        loginTime: now,
        lastActivity: now,
      }

      setUser(userWithSession)
      setCsrfToken(data.csrf_token)
      setSessionTimeRemaining(SESSION_DURATION)
      setIsSessionExpired(false)

      // Store user data and session info
      if (isBrowser) {
        localStorage.setItem("library_user", JSON.stringify(userWithSession))
        localStorage.setItem("library_csrf_token", data.csrf_token)
        localStorage.setItem("library_session_id", sessionId)
      }

      console.log("Auth context: Login successful with session:", sessionId)
      return { success: true }
    } catch (error) {
      console.error("Auth context: Login error:", error)

      let errorMessage = "Login failed. Please try again."

      if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 403) {
          errorMessage = "Invalid Credentials!!"
        } else if (error.status === 400) {
          // Handle 400 errors more specifically
          if (
            error.message.includes("Invalid username or password") ||
            error.message.includes("Invalid credentials") ||
            error.message.includes("Authentication failed")
          ) {
            errorMessage = "Invalid Credentials!!"
          } else if (error.message.includes("HTML instead of JSON")) {
            errorMessage = "Server is not responding correctly. Please try again later."
          } else {
            errorMessage = `Login error: ${error.message}`
          }
        } else if (error.status === 0) {
          errorMessage = "Unable to connect to the server. Please check your internet connection."
        } else {
          errorMessage = error.message
        }
      } else {
        // For any other authentication-related errors, show Invalid Credentials
        if (
          error.message &&
          (error.message.includes("credentials") ||
            error.message.includes("password") ||
            error.message.includes("username") ||
            error.message.includes("authentication") ||
            error.message.includes("login"))
        ) {
          errorMessage = "Invalid Credentials!!"
        }
      }

      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        csrfToken,
        sessionTimeRemaining,
        isSessionExpired,
        updateSessionTime,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
