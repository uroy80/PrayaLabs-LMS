"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Loader2, Server } from "lucide-react"
import { libraryAPI } from "@/lib/api"

export function NetworkTest() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (message: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testConnectivity = async () => {
    setLoading(true)
    addResult("Testing network connectivity...")

    try {
      // Test basic connectivity
      const response = await fetch("https://lib.prayalabs.com", {
        method: "HEAD",
        mode: "no-cors",
      })
      addResult("✅ Server is reachable")
    } catch (error) {
      addResult(`❌ Server connectivity failed: ${error.message}`)
    }

    try {
      // Test CORS preflight for author endpoint
      const response = await fetch("https://lib.prayalabs.com/web/lmsbookauthor/8?_format=json", {
        method: "OPTIONS",
        headers: {
          "Content-Type": "application/json",
        },
      })
      addResult(`✅ CORS preflight: ${response.status}`)
    } catch (error) {
      addResult(`❌ CORS preflight failed: ${error.message}`)
    }

    try {
      // Test proxy endpoint with author API
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: "/web/lmsbookauthor/8?_format=json",
          method: "GET",
        }),
      })
      const result = await response.json()
      addResult(`✅ Proxy endpoint works: ${response.status} - ${result.success ? "Success" : "Failed"}`)
    } catch (error) {
      addResult(`❌ Proxy endpoint failed: ${error.message}`)
    }

    setLoading(false)
  }

  const testLogin = async () => {
    setLoading(true)
    addResult("Testing login via proxy...")

    try {
      const result = await libraryAPI.login("Alana Rivers", "a")
      addResult(`✅ Login successful: ${result.current_user.name} (${result.current_user.uid})`)
    } catch (error) {
      addResult(`❌ Login failed: ${error.message}`)
    }

    setLoading(false)
  }

  const testAuthorAPI = async () => {
    setLoading(true)
    addResult("Testing author API via proxy...")

    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: "/web/jsonapi/lmsbookauthor/lmsbookauthor",
          method: "GET",
          headers: {
            Accept: "application/vnd.api+json",
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        const authorCount = result.data?.data?.length || 0
        addResult(`✅ Author API Success: Found ${authorCount} authors`)

        if (authorCount > 0) {
          const firstAuthor = result.data.data[0]
          const authorId = firstAuthor.id
          addResult(`📚 First author ID: ${authorId}`)

          // Try to get details for this author
          const detailsResponse = await fetch("/api/proxy", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              endpoint: `/web/lmsbookauthor/${authorId}?_format=json`,
              method: "GET",
            }),
          })

          const detailsResult = await detailsResponse.json()
          if (detailsResult.success) {
            addResult(`✅ Author details retrieved successfully`)
            addResult(`📚 Author name: ${detailsResult.data.name || "Unknown"}`)
            const bookCount = detailsResult.data.books?.length || 0
            addResult(`📚 Books by author: ${bookCount}`)
          } else {
            addResult(`❌ Failed to get author details: ${detailsResult.error || "Unknown error"}`)
          }
        }
      } else {
        addResult(`❌ Author API Error: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      addResult(`❌ Author API Error: ${error.message}`)
    }

    setLoading(false)
  }

  const testBasicAuth = async () => {
    setLoading(true)
    addResult("Testing Basic Authentication...")

    try {
      // Test with sample credentials
      const username = "Alana Rivers"
      const password = "a"
      const basicAuth = btoa(`${username}:${password}`)

      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: "/web/lmsbookauthor/8?_format=json",
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${basicAuth}`,
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        addResult(`✅ Basic Auth Success: ${response.status}`)
        addResult(`📚 Author data retrieved: ${result.data?.name || "Unknown"}`)
      } else {
        addResult(`❌ Basic Auth Failed: ${result.error || "Unknown error"}`)
        if (result.status === 401) {
          addResult("🔐 Authentication required - check credentials")
        }
      }
    } catch (error) {
      addResult(`❌ Basic Auth Error: ${error.message}`)
    }

    setLoading(false)
  }

  const toggleProxy = () => {
    libraryAPI.setUseProxy(false)
    addResult("🔄 Switched to direct API calls (will likely fail due to CORS)")
  }

  const enableProxy = () => {
    libraryAPI.setUseProxy(true)
    addResult("🔄 Switched to proxy API calls")
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Server className="mr-2 h-5 w-5" />
          Network & API Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={testConnectivity} disabled={loading} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wifi className="h-4 w-4 mr-2" />}
            Test Connection
          </Button>
          <Button onClick={testLogin} disabled={loading} size="sm" variant="default">
            Test Login
          </Button>
          <Button onClick={testAuthorAPI} disabled={loading} size="sm" variant="default">
            Test Author API
          </Button>
          <Button onClick={testBasicAuth} disabled={loading} size="sm" variant="default">
            Test Basic Auth
          </Button>
          <Button onClick={enableProxy} size="sm" variant="outline">
            Use Proxy
          </Button>
          <Button onClick={toggleProxy} size="sm" variant="outline">
            Use Direct
          </Button>
          <Button onClick={clearResults} variant="outline" size="sm">
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={navigator.onLine ? "default" : "destructive"}>
            {navigator.onLine ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
        </div>

        {testResults.length > 0 && (
          <div className="bg-gray-100 p-4 rounded-lg max-h-60 overflow-y-auto">
            <h4 className="font-medium mb-2">Test Results:</h4>
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {result}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
