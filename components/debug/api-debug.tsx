"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth/auth-context"

export function ApiDebug() {
  const [endpoint, setEndpoint] = useState("/web/api/books")
  const [method, setMethod] = useState("GET")
  const [headers, setHeaders] = useState("")
  const [body, setBody] = useState("")
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const makeRequest = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const headersObj = headers
        ? JSON.parse(headers)
        : {
            "Content-Type": "application/json",
          }

      const options: RequestInit = {
        method,
        headers: headersObj,
      }

      if (method !== "GET" && method !== "HEAD" && body) {
        options.body = body
      }

      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint,
          method,
          headers: headersObj,
          data: body ? JSON.parse(body) : undefined,
        }),
      })

      const result = await response.json()
      setResponse(result)
    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }

  const testPublicBooksApi = async () => {
    setEndpoint("/web/api/books")
    setMethod("GET")
    setHeaders("")
    setBody("")
    await makeRequest()
  }

  const setPresetEndpoint = (newEndpoint: string) => {
    setEndpoint(newEndpoint)

    // Set default Basic Auth for author endpoints
    if (newEndpoint.includes("lmsbookauthor")) {
      const basicAuth = btoa("Alana Rivers:a")
      setHeaders(
        JSON.stringify(
          {
            "Content-Type": "application/json",
            Authorization: `Basic ${basicAuth}`,
          },
          null,
          2,
        ),
      )
    }
  }

  if (!user) {
    return null
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>API Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Endpoint</label>
          <Input
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="/web/api/books?_format=json"
          />
          <div>
            <Button size="sm" onClick={() => setPresetEndpoint("/web/api/books")}>
              /web/api/books
            </Button>
            <Button size="sm" onClick={() => setPresetEndpoint("/web/books/categories")}>
              /web/books/categories
            </Button>
            <Button size="sm" onClick={() => setPresetEndpoint("/web/search/suggestions")}>
              /web/search/suggestions
            </Button>
            <Button size="sm" onClick={() => setPresetEndpoint("/web/jsonapi/lmsbookauthor/lmsbookauthor")}>
              /web/jsonapi/lmsbookauthor/lmsbookauthor
            </Button>
            <Button size="sm" onClick={() => setPresetEndpoint("/web/lmsbookauthor/8?_format=json")}>
              /web/lmsbookauthor/8
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full p-2 border rounded">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>

        <Tabs defaultValue="headers">
          <TabsList>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
          </TabsList>
          <TabsContent value="headers" className="space-y-2">
            <label className="text-sm font-medium">Headers (JSON)</label>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              placeholder='{"Content-Type": "application/json"}'
              className="w-full h-32 p-2 border rounded font-mono text-sm"
            />
          </TabsContent>
          <TabsContent value="body" className="space-y-2">
            <label className="text-sm font-medium">Body (JSON)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"key": "value"}'
              className="w-full h-32 p-2 border rounded font-mono text-sm"
            />
          </TabsContent>
        </Tabs>

        <Button onClick={makeRequest} disabled={loading}>
          {loading ? "Sending..." : "Send Request"}
        </Button>
        <Button onClick={testPublicBooksApi} disabled={loading}>
          Test Public Books API
        </Button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-medium text-red-800">Error</h3>
            <pre className="mt-2 text-sm text-red-700 overflow-auto">{error}</pre>
          </div>
        )}

        {response && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <h3 className="font-medium">Response</h3>
            <div className="mt-2 text-sm">
              <p>
                Status: <span className="font-mono">{response.status || "Unknown"}</span>
              </p>
              <p>
                Success: <span className="font-mono">{response.success ? "true" : "false"}</span>
              </p>
            </div>
            <div className="mt-2">
              <h4 className="text-sm font-medium">Data:</h4>
              <pre className="mt-1 p-2 bg-gray-100 rounded overflow-auto text-xs max-h-64">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
