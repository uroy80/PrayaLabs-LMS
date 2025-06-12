import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, method = "GET", headers = {}, data } = body

    console.log("🔄 Proxy request:", { endpoint, method, hasData: !!data, hasAuth: !!headers.Authorization })
    console.log("📤 Request data:", data)

    // Prepare headers - keep it simple for login
    const requestHeaders: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; Library-PWA/1.0)",
    }

    // Add Content-Type for requests with data
    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      requestHeaders["Content-Type"] = "application/json"
    }

    // Add any additional headers (including Authorization)
    if (headers && Object.keys(headers).length > 0) {
      Object.assign(requestHeaders, headers)
    }

    console.log("📤 Request headers:", {
      ...requestHeaders,
      Authorization: requestHeaders.Authorization ? "[REDACTED]" : undefined,
    })

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    }

    // Only add body for requests that support it
    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      requestOptions.body = JSON.stringify(data)
      console.log("📤 Request body:", JSON.stringify(data))
    }

    const fullUrl = `https://lib.prayalabs.com${endpoint}`
    console.log("🌐 Full URL:", fullUrl)

    const response = await fetch(fullUrl, requestOptions)

    console.log("📥 Response status:", response.status, response.statusText)
    console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("📥 Response text length:", responseText.length)
    console.log("📥 Response preview:", responseText.substring(0, 500))

    // Try to parse as JSON
    let responseData
    try {
      responseData = JSON.parse(responseText)
      console.log("✅ Successfully parsed JSON response")
      console.log("📊 Response data keys:", typeof responseData === "object" ? Object.keys(responseData) : "not object")
    } catch (parseError) {
      console.log("❌ Failed to parse JSON:", parseError.message)
      console.log("📄 Raw response:", responseText)

      // If it's not JSON, check if it's an error page
      if (responseText.includes("<html") || responseText.includes("<!DOCTYPE")) {
        return NextResponse.json(
          {
            error: "Server returned HTML instead of JSON",
            details: `HTTP ${response.status}: The server may be down or the endpoint may not exist`,
            success: false,
            status: response.status,
          },
          { status: response.status },
        )
      }

      responseData = responseText
    }

    // Return the response with success status
    return NextResponse.json(
      {
        data: responseData,
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
      },
      { status: response.ok ? 200 : response.status },
    )
  } catch (error) {
    console.error("❌ Proxy error:", error)
    return NextResponse.json(
      {
        error: "Proxy request failed",
        details: error.message,
        success: false,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const endpoint = url.searchParams.get("endpoint")

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint parameter required" }, { status: 400 })
    }

    console.log("🔄 Proxy GET request:", endpoint)

    // Special handling for books API
    const requestHeaders: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; Library-PWA/1.0)",
    }

    const response = await fetch(`https://lib.prayalabs.com${endpoint}`, {
      method: "GET",
      headers: requestHeaders,
    })

    console.log("📥 Direct GET response:", response.status, response.statusText)

    const responseText = await response.text()

    // Try to parse as JSON
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = responseText
    }

    return NextResponse.json(
      {
        data: responseData,
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
      },
      { status: response.ok ? 200 : response.status },
    )
  } catch (error) {
    console.error("❌ Proxy GET error:", error)
    return NextResponse.json({ error: "Proxy request failed", details: error.message }, { status: 500 })
  }
}
