"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { libraryAPI } from "@/lib/api"
import { useAuth } from "@/components/auth/auth-context"
import { ApiDebug } from "./api-debug"

export function ApiTest() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("tests")
  const { user } = useAuth()

  const addResult = (message: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testBooksAPI = async () => {
    setLoading(true)
    addResult("Testing Books API...")

    try {
      const books = await libraryAPI.getBooks({ limit: 5 })
      addResult(`✅ Books API Success: Found ${Array.isArray(books) ? books.length : "unknown"} books`)
      addResult(`📚 Sample response: ${JSON.stringify(books).substring(0, 200)}...`)
    } catch (error) {
      addResult(`❌ Books API Error: ${error.message}`)
    }

    setLoading(false)
  }

  const testSearchAPI = async () => {
    if (!searchTerm.trim()) {
      addResult("❌ Please enter a search term")
      return
    }

    setLoading(true)
    addResult(`Testing Books Search API with term: "${searchTerm}"`)

    try {
      const books = await libraryAPI.getBooks({ search: searchTerm, limit: 3 })
      addResult(`✅ Search API Success: Found ${Array.isArray(books) ? books.length : "unknown"} books`)
      addResult(`🔍 Search response: ${JSON.stringify(books).substring(0, 200)}...`)
    } catch (error) {
      addResult(`❌ Search API Error: ${error.message}`)
    }

    setLoading(false)
  }

  const testUserProfile = async () => {
    setLoading(true)
    addResult("Testing User Profile API...")

    try {
      const profile = await libraryAPI.getUserProfile()
      addResult(`✅ Profile API Success: ${JSON.stringify(profile).substring(0, 100)}...`)
    } catch (error) {
      addResult(`❌ Profile API Error: ${error.message}`)
    }

    setLoading(false)
  }

  const testCategoriesAPI = async () => {
    setLoading(true)
    addResult("Testing Categories API...")

    try {
      const categories = await libraryAPI.getCategories()
      addResult(`✅ Categories API Success: ${JSON.stringify(categories)}`)
    } catch (error) {
      addResult(`❌ Categories API Error: ${error.message}`)
    }

    setLoading(false)
  }

  const testBooksAPIDirectly = async () => {
    setLoading(true)
    addResult("Testing Books API directly...")

    // Test 1: Direct fetch
    try {
      const response = await fetch("https://lib.prayalabs.com/web/api/books", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; Library-PWA/1.0)",
        },
        mode: "cors",
      })
      addResult(`✅ Direct fetch: ${response.status} ${response.statusText}`)
      if (response.ok) {
        const data = await response.json()
        addResult(`📚 Direct data: ${Array.isArray(data) ? data.length : "not array"} items`)
      }
    } catch (error) {
      addResult(`❌ Direct fetch error: ${error.message}`)
    }

    // Test 2: Proxy fetch
    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: "/web/api/books",
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }),
      })
      const result = await response.json()
      addResult(`✅ Proxy fetch: ${result.status} - Success: ${result.success}`)
      if (result.success && Array.isArray(result.data)) {
        addResult(`📚 Proxy data: ${result.data.length} items`)
      }
    } catch (error) {
      addResult(`❌ Proxy fetch error: ${error.message}`)
    }

    setLoading(false)
  }

  const testAuthorAPI = async () => {
    setLoading(true)
    addResult("Testing Author API...")

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
        addResult(`📚 Sample response: ${JSON.stringify(result.data).substring(0, 200)}...`)
      } else {
        addResult(`❌ Author API Error: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      addResult(`❌ Author API Error: ${error.message}`)
    }

    setLoading(false)
  }

  const testBasicAuthAPI = async () => {
    setLoading(true)
    addResult("Testing Basic Auth API...")

    try {
      const username = "Alana Rivers"
      const password = "a"
      const basicAuth = btoa(`${username}:${password}`)

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
            Authorization: `Basic ${basicAuth}`,
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        const authorCount = result.data?.data?.length || 0
        addResult(`✅ Basic Auth API Success: Found ${authorCount} authors`)
        addResult(`📚 Sample response: ${JSON.stringify(result.data).substring(0, 200)}...`)
      } else {
        addResult(`❌ Basic Auth API Error: ${result.error || "Unknown error"}`)
        if (result.status === 401) {
          addResult("🔐 Authentication failed - invalid credentials")
        }
      }
    } catch (error) {
      addResult(`❌ Basic Auth API Error: ${error.message}`)
    }

    setLoading(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tests">API Tests</TabsTrigger>
          <TabsTrigger value="debug">API Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>API Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button onClick={testBooksAPI} disabled={loading} size="sm">
                  Test Books API
                </Button>
                <Button onClick={testAuthorAPI} disabled={loading} size="sm">
                  Test Author API
                </Button>
                <Button onClick={testBooksAPIDirectly} disabled={loading} size="sm">
                  Test Books API Direct
                </Button>
                <Button onClick={testCategoriesAPI} disabled={loading} size="sm">
                  Test Categories
                </Button>
                <Button onClick={testUserProfile} disabled={loading} size="sm">
                  Test Profile API
                </Button>
                <Button onClick={testBasicAuthAPI} disabled={loading} size="sm">
                  Test Basic Auth API
                </Button>
                <Button onClick={clearResults} variant="outline" size="sm">
                  Clear Results
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter search term..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && testSearchAPI()}
                  className="flex-1"
                />
                <Button onClick={testSearchAPI} disabled={loading || !searchTerm.trim()} size="sm">
                  Test Search
                </Button>
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
        </TabsContent>

        <TabsContent value="debug">
          <ApiDebug />
        </TabsContent>
      </Tabs>
    </div>
  )
}
