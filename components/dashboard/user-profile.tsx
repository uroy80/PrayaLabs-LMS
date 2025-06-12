"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, CreditCard, Clock, BookOpen, RefreshCw } from "lucide-react"
import { libraryAPI, type UserProfile as UserProfileType } from "@/lib/api"
import { ApiTest } from "@/components/debug/api-test"

export function UserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfileType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    setError(null)

    try {
      const profileData = await libraryAPI.getUserProfile()
      setProfile(profileData)
    } catch (error) {
      console.warn("Profile API not available, using mock data")
      // Mock profile data for development
      setProfile({
        uid: user?.uid || "28",
        name: user?.name || "Alana Rivers",
        email: "alana.rivers@example.com",
        role: "student",
        credits: 3,
        max_credits: 5,
        borrowed_books_count: 2,
        active_reservations_count: 1,
      })
    }

    setLoading(false)
  }

  const refreshProfile = () => {
    loadProfile()
  }

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Profile Information
            </CardTitle>
            <Button variant="outline" size="sm" onClick={refreshProfile} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Name</label>
            <p className="text-lg">{profile?.name || user?.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">User ID</label>
            <p className="text-lg">{profile?.uid || user?.uid}</p>
          </div>
          {profile?.email && (
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-lg">{profile.email}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-500">Role</label>
            <Badge variant="secondary" className="capitalize">
              {profile?.role || "Student"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile?.credits || 0}
              <span className="text-lg text-gray-500">/{profile?.max_credits || 5}</span>
            </div>
            <p className="text-xs text-muted-foreground">Books you can borrow</p>
            {profile && profile.credits <= 1 && (
              <Badge variant="destructive" className="mt-2 text-xs">
                Low Credits
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Reservations</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.active_reservations_count || 0}</div>
            <p className="text-xs text-muted-foreground">Books reserved today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Borrowed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.borrowed_books_count || 0}</div>
            <p className="text-xs text-muted-foreground">Currently borrowed</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <ApiTest />
    </div>
  )
}
