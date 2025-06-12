interface LoginRequest {
  name: string
  pass: string
}

interface LoginResponse {
  current_user: {
    uid: string
    name: string
  }
  csrf_token: string
  logout_token: string
}

interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  category?: string
  status: "available" | "borrowed" | "reserved"
  description?: string
  cover_image?: string
  publication_year?: number
  publisher?: string
  price?: string
  copies?: string
  total_issued_books?: string
  books_available?: number
  books_issued?: number
  featured_image?: string
  details?: string
  lmsbook_category?: string
  lmspublication?: string
  uid?: string[]
}

interface Author {
  id: string
  uuid: string
  title: string
  description: string
  created: string
}

interface Publication {
  id: string
  title: string
  description: string
}

interface Category {
  id: string
  title: string
  description: string
}

interface BooksApiResponse {
  book_title: string
  publication: string
  author: string
  category: string
  isbn_number: string
  no_of_copies: string
  price: string
  total_issued_books?: string
}

interface UserProfile {
  uid: string
  name: string
  email?: string
  role: "student" | "faculty"
  credits: number
  max_credits: number
  borrowed_books_count: number
  active_reservations_count: number
}

interface Reservation {
  id: string
  book_id: string
  book_title: string
  book_author: string
  reserved_at: string
  expires_at: string
  status: "active" | "expired" | "collected"
}

interface BorrowedBook {
  id: string
  book_id: string
  book_title: string
  book_author: string
  borrowed_at: string
  due_date: string
  status: "active" | "overdue" | "returned"
}

interface ApiError {
  message: string
  status: number
}

// Helper to check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

class LibraryAPI {
  private baseUrl = "https://lib.prayalabs.com"
  private useProxy = true
  private csrfToken: string | null = null
  private logoutToken: string | null = null
  private username: string | null = null
  private password: string | null = null
  private sessionId: string | null = null
  private authorsCache: Map<string, Author> = new Map()
  private publicationsCache: Map<string, Publication> = new Map()
  private categoriesCache: Map<string, Category> = new Map()
  private authorsLoaded = false
  private publicationsLoaded = false
  private categoriesLoaded = false

  constructor() {
    if (isBrowser) {
      this.csrfToken = localStorage.getItem("library_csrf_token")
      this.logoutToken = localStorage.getItem("library_logout_token")
      this.sessionId = localStorage.getItem("library_session_id")
    }
  }

  private async makeProxyRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    console.log(`🔄 Making proxy request to ${endpoint}`, options.method || "GET")

    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint,
          method: options.method || "GET",
          headers: options.headers,
          data: options.body ? JSON.parse(options.body as string) : undefined,
        }),
      })

      const result = await response.json()
      console.log(`📥 Proxy response for ${endpoint}:`, {
        status: result.status,
        success: result.success,
        hasData: !!result.data,
      })

      if (!result.success) {
        const errorMessage =
          result.details || result.error || `${result.status} ${result.statusText || "Unknown error"}`

        // Create a more specific error with status
        const apiError = new ApiError(errorMessage, result.status || 500)

        // Don't log 404s as errors for author/publication endpoints - they're expected
        if (result.status === 404 && (endpoint.includes("/lmsbookauthor/") || endpoint.includes("/lmspublication"))) {
          console.log(`ℹ️ Resource not found (404): ${endpoint}`)
        } else {
          console.error(`❌ API Error for ${endpoint}:`, errorMessage)
        }

        throw apiError
      }

      if (result.data) {
        console.log("📊 Response data received successfully")
      }

      return result.data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      console.error(`❌ Proxy request error for ${endpoint}:`, error)
      throw new ApiError(`Request failed: ${error.message}`, 500)
    }
  }

  async login(username: string, password: string, sessionId: string): Promise<LoginResponse> {
    try {
      console.log("🔐 Attempting login with credentials:", { username })

      // Exact API specification from client
      const loginData: LoginRequest = {
        name: username,
        pass: password,
      }

      console.log("📤 Login request data:", loginData)

      const data = await this.makeProxyRequest("/web/user/login?_format=json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(loginData),
      })

      console.log("✅ Login response received:", data)

      // Validate response structure
      if (!data.current_user) {
        throw new ApiError("Invalid login response - missing user data", 400)
      }

      if (!data.current_user.uid || !data.current_user.name) {
        throw new ApiError("Invalid login response - incomplete user data", 400)
      }

      if (!data.csrf_token) {
        throw new ApiError("Invalid login response - missing CSRF token", 400)
      }

      console.log("🎉 Login successful:", {
        uid: data.current_user.uid,
        name: data.current_user.name,
        hasCsrfToken: !!data.csrf_token,
        hasLogoutToken: !!data.logout_token,
      })

      // Store credentials and tokens
      this.csrfToken = data.csrf_token
      this.logoutToken = data.logout_token
      this.username = username
      this.password = password
      this.sessionId = sessionId

      // Store in localStorage
      if (isBrowser) {
        localStorage.setItem("library_csrf_token", data.csrf_token)
        if (data.logout_token) {
          localStorage.setItem("library_logout_token", data.logout_token)
        }
        localStorage.setItem("library_session_id", sessionId)
      }

      return data
    } catch (error) {
      console.error("❌ Login error:", error)

      if (error instanceof ApiError) {
        // Check for authentication-specific errors
        if (error.status === 401 || error.status === 403) {
          throw new ApiError("Invalid Credentials!!", error.status)
        } else if (error.status === 400) {
          // Check if the error message indicates invalid credentials
          if (
            error.message.includes("Invalid username or password") ||
            error.message.includes("Invalid credentials") ||
            error.message.includes("Authentication failed") ||
            error.message.includes("Bad credentials")
          ) {
            throw new ApiError("Invalid Credentials!!", 400)
          }
        }
        throw error
      }

      // For network or other errors, check if they're credential-related
      if (
        error.message &&
        (error.message.toLowerCase().includes("credentials") ||
          error.message.toLowerCase().includes("password") ||
          error.message.toLowerCase().includes("username") ||
          error.message.toLowerCase().includes("authentication") ||
          error.message.toLowerCase().includes("unauthorized"))
      ) {
        throw new ApiError("Invalid Credentials!!", 401)
      }

      throw new ApiError(`Login failed: ${error.message}`, 0)
    }
  }

  async logout(sessionId?: string): Promise<void> {
    if (!isBrowser) return

    console.log("🔓 Starting logout process...")

    // Always clear local data first
    this.csrfToken = null
    this.logoutToken = null
    this.username = null
    this.password = null
    this.sessionId = null
    this.authorsCache.clear()
    this.publicationsCache.clear()
    this.categoriesCache.clear()
    this.authorsLoaded = false
    this.publicationsLoaded = false
    this.categoriesLoaded = false

    // Clear localStorage immediately
    if (isBrowser) {
      localStorage.removeItem("library_csrf_token")
      localStorage.removeItem("library_logout_token")
      localStorage.removeItem("library_session_id")
      localStorage.removeItem("library_user")
    }

    console.log("🧹 Local logout cleanup completed")

    // Try server logout in background (don't wait for it)
    try {
      if (this.logoutToken) {
        console.log("🔓 Attempting server logout (background)...")

        await this.makeProxyRequest("/web/user/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        })
        console.log("✅ Server logout successful")
      } else {
        console.log("ℹ️ No logout token available, skipping server logout")
      }
    } catch (error) {
      console.warn("⚠️ Server logout failed (this is OK, local cleanup already done):", error.message)
    }
  }

  async verifySession(sessionId: string): Promise<boolean> {
    try {
      // Simple session verification - check if we have valid tokens
      if (!this.csrfToken) {
        console.log("❌ No CSRF token available for session verification")
        return false
      }

      console.log("✅ Session verification: CSRF token exists")
      return true
    } catch (error) {
      console.warn("⚠️ Session verification failed:", error)
      return false
    }
  }

  private async makeAuthenticatedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.csrfToken) {
      throw new ApiError("Not authenticated - missing CSRF token", 401)
    }

    if (!this.username || !this.password) {
      throw new ApiError("Not authenticated - missing credentials", 401)
    }

    // Create Basic Auth header
    const basicAuth = btoa(`${this.username}:${this.password}`)

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": this.csrfToken,
      Authorization: `Basic ${basicAuth}`,
      ...options.headers,
    }

    try {
      const response = await this.makeProxyRequest(endpoint, {
        ...options,
        headers,
      })
      return response
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 403) {
          // Session might be invalid, force logout
          throw new ApiError("Session expired. Please login again.", 401)
        } else if (error.status === 404) {
          // Handle 404 more gracefully
          throw new ApiError(`Endpoint not found: ${endpoint}`, 404)
        }
      }
      throw error
    }
  }

  // Parse author data from the API response format
  private parseAuthorData(authorData: any): Author {
    const getValue = (field: any) => {
      if (!field || !Array.isArray(field) || field.length === 0) return ""
      return field[0].value || ""
    }

    const getProcessedValue = (field: any) => {
      if (!field || !Array.isArray(field) || field.length === 0) return ""
      return field[0].processed || field[0].value || ""
    }

    // Extract the author ID correctly
    let id = ""
    if (authorData.id && Array.isArray(authorData.id)) {
      id = String(authorData.id[0].value || "")
    } else {
      id = String(authorData.id || "")
    }

    return {
      id: id,
      uuid: getValue(authorData.uuid),
      title: getValue(authorData.title), // Author name is in the title field
      description: getProcessedValue(authorData.text_long),
      created: getValue(authorData.created),
    }
  }

  // Parse publication data from the API response format
  private parsePublicationData(publicationData: any): Publication {
    const getValue = (field: any) => {
      if (!field || !Array.isArray(field) || field.length === 0) return ""
      return field[0].value || ""
    }

    const getProcessedValue = (field: any) => {
      if (!field || !Array.isArray(field) || field.length === 0) return ""
      return field[0].processed || field[0].value || ""
    }

    // For JSON API format, extract from attributes
    if (publicationData.attributes) {
      return {
        id: String(publicationData.attributes.drupal_internal__id || publicationData.id || ""),
        title: publicationData.attributes.title || "Unknown Publisher",
        description:
          publicationData.attributes.text_long?.processed || publicationData.attributes.text_long?.value || "",
      }
    }

    // For direct format
    let id = ""
    if (publicationData.id && Array.isArray(publicationData.id)) {
      id = String(publicationData.id[0].value || "")
    } else {
      id = String(publicationData.id || "")
    }

    return {
      id: id,
      title: getValue(publicationData.title) || "Unknown Publisher",
      description: getProcessedValue(publicationData.text_long),
    }
  }

  // Parse category data from the API response format
  private parseCategoryData(categoryData: any): Category {
    const getValue = (field: any) => {
      if (!field || !Array.isArray(field) || field.length === 0) return ""
      return field[0].value || ""
    }

    const getProcessedValue = (field: any) => {
      if (!field || !Array.isArray(field) || field.length === 0) return ""
      return field[0].processed || field[0].value || ""
    }

    // For JSON API format, extract from attributes
    if (categoryData.attributes) {
      return {
        id: String(categoryData.attributes.drupal_internal__id || categoryData.id || ""),
        title: categoryData.attributes.title || "General",
        description: categoryData.attributes.text_long?.processed || categoryData.attributes.text_long?.value || "",
      }
    }

    // For direct format
    let id = ""
    if (categoryData.id && Array.isArray(categoryData.id)) {
      id = String(categoryData.id[0].value || "")
    } else {
      id = String(categoryData.id || "")
    }

    return {
      id: id,
      title: getValue(categoryData.title) || "General",
      description: getProcessedValue(categoryData.text_long),
    }
  }

  // Load authors data using the new endpoint
  private async loadAuthors(): Promise<void> {
    if (this.authorsLoaded) return

    try {
      console.log("📚 Loading authors data using Basic Auth...")

      // First ensure we have authentication
      if (!this.username || !this.password) {
        console.log("❌ Authentication required for author data")
        this.authorsLoaded = true // Mark as loaded to prevent retries
        return
      }

      // Create Basic Auth header
      const basicAuth = btoa(`${this.username}:${this.password}`)

      // Expanded list to include ID 7 and more IDs based on the book relationships
      const testAuthorIds = ["7", "8", "13", "1", "2", "3", "4", "5", "6", "9", "10", "11", "12", "14", "15"]

      let successCount = 0
      let errorCount = 0

      for (const authorId of testAuthorIds) {
        try {
          console.log(`🔍 Fetching author ID: ${authorId}`)

          const authorData = await this.makeProxyRequest(`/web/lmsbookauthor/${authorId}?_format=json`, {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Basic ${basicAuth}`,
            },
          })

          if (authorData) {
            const author = this.parseAuthorData(authorData)
            // Store by the actual ID value for matching with books
            this.authorsCache.set(String(authorId), author)
            console.log(`✅ Loaded author: "${author.title}" (ID: ${authorId})`)
            successCount++
          }
        } catch (error) {
          errorCount++
          if (error.status === 404) {
            console.log(`ℹ️ Author ID ${authorId} not found (404) - skipping`)
          } else {
            console.warn(`⚠️ Error fetching author ${authorId}:`, error.message)
          }
          // Continue with other authors - don't let individual failures stop the process
          continue
        }
      }

      this.authorsLoaded = true
      console.log(`✅ Author loading completed: ${successCount} successful, ${errorCount} failed`)
      console.log(`📋 Total cached authors: ${this.authorsCache.size}`)

      // Log all cached authors for debugging
      if (this.authorsCache.size > 0) {
        console.log("📋 Successfully cached authors:")
        this.authorsCache.forEach((author, id) => {
          console.log(`  - ID ${id}: "${author.title}"`)
        })
      } else {
        console.log("⚠️ No authors were successfully loaded")
      }
    } catch (error) {
      console.error("❌ Failed to load authors data:", error)
      this.authorsLoaded = true // Mark as loaded to prevent retries
    }
  }

  // Load publications data using the book UUIDs
  private async loadPublications(bookUuids: string[]): Promise<void> {
    if (this.publicationsLoaded || bookUuids.length === 0) return

    try {
      console.log("📖 Loading publications data...")

      let successCount = 0
      let errorCount = 0

      for (const bookUuid of bookUuids) {
        try {
          console.log(`🔍 Fetching publication for book UUID: ${bookUuid}`)

          const publicationData = await this.makeProxyRequest(
            `/web/jsonapi/lmsbook/lmsbook/${bookUuid}/lmspublication`,
            {
              method: "GET",
              headers: {
                Accept: "application/vnd.api+json",
              },
            },
          )

          if (publicationData && publicationData.data) {
            const publication = this.parsePublicationData(publicationData.data)
            // Store by the publication ID for matching with books
            this.publicationsCache.set(String(publication.id), publication)
            console.log(`✅ Loaded publication: "${publication.title}" (ID: ${publication.id})`)
            successCount++
          }
        } catch (error) {
          errorCount++
          if (error.status === 404) {
            console.log(`ℹ️ Publication for book ${bookUuid} not found (404) - skipping`)
          } else {
            console.warn(`⚠️ Error fetching publication for book ${bookUuid}:`, error.message)
          }
          // Continue with other publications - don't let individual failures stop the process
          continue
        }
      }

      this.publicationsLoaded = true
      console.log(`✅ Publication loading completed: ${successCount} successful, ${errorCount} failed`)
      console.log(`📋 Total cached publications: ${this.publicationsCache.size}`)

      // Log all cached publications for debugging
      if (this.publicationsCache.size > 0) {
        console.log("📋 Successfully cached publications:")
        this.publicationsCache.forEach((publication, id) => {
          console.log(`  - ID ${id}: "${publication.title}"`)
        })
      } else {
        console.log("⚠️ No publications were successfully loaded")
      }
    } catch (error) {
      console.error("❌ Failed to load publications data:", error)
      this.publicationsLoaded = true // Mark as loaded to prevent retries
    }
  }

  // Load categories data using the book UUIDs
  private async loadCategories(bookUuids: string[]): Promise<void> {
    if (this.categoriesLoaded || bookUuids.length === 0) return

    try {
      console.log("📂 Loading categories data...")

      let successCount = 0
      let errorCount = 0

      for (const bookUuid of bookUuids) {
        try {
          console.log(`🔍 Fetching category for book UUID: ${bookUuid}`)

          const categoryData = await this.makeProxyRequest(
            `/web/jsonapi/lmsbook/lmsbook/${bookUuid}/lmsbook_category`,
            {
              method: "GET",
              headers: {
                Accept: "application/vnd.api+json",
              },
            },
          )

          if (categoryData && categoryData.data) {
            const category = this.parseCategoryData(categoryData.data)
            // Store by the category ID for matching with books
            this.categoriesCache.set(String(category.id), category)
            console.log(`✅ Loaded category: "${category.title}" (ID: ${category.id})`)
            successCount++
          } else {
            console.log(`ℹ️ Category for book ${bookUuid} returned null data - skipping`)
          }
        } catch (error) {
          errorCount++
          if (error.status === 404) {
            console.log(`ℹ️ Category for book ${bookUuid} not found (404) - skipping`)
          } else {
            console.warn(`⚠️ Error fetching category for book ${bookUuid}:`, error.message)
          }
          // Continue with other categories - don't let individual failures stop the process
          continue
        }
      }

      this.categoriesLoaded = true
      console.log(`✅ Category loading completed: ${successCount} successful, ${errorCount} failed`)
      console.log(`📋 Total cached categories: ${this.categoriesCache.size}`)

      // Log all cached categories for debugging
      if (this.categoriesCache.size > 0) {
        console.log("📋 Successfully cached categories:")
        this.categoriesCache.forEach((category, id) => {
          console.log(`  - ID ${id}: "${category.title}"`)
        })
      } else {
        console.log("⚠️ No categories were successfully loaded")
      }
    } catch (error) {
      console.error("❌ Failed to load categories data:", error)
      this.categoriesLoaded = true // Mark as loaded to prevent retries
    }
  }

  // Transform Drupal JSON API book data to our Book interface
  private transformDrupalBookData(drupalBook: any): Book {
    // Handle JSON API format correctly
    const bookData = drupalBook
    const attributes = drupalBook.attributes || drupalBook
    const relationships = drupalBook.relationships || {}

    // Extract values from Drupal field format
    const getValue = (field: any) => {
      if (!field) return ""
      if (Array.isArray(field) && field.length > 0) {
        return field[0].value || field[0].target_id || field[0]
      }
      if (field.value !== undefined) return field.value
      return field
    }

    // Extract author IDs from relationships.uid.data array
    const getAuthorIds = (book: any): string[] => {
      try {
        // Check if we have relationships.uid.data structure (JSON API format)
        if (book.relationships?.uid?.data && Array.isArray(book.relationships.uid.data)) {
          const authorIds = book.relationships.uid.data
            .map((author: any) => String(author.meta?.drupal_internal__target_id || ""))
            .filter((id) => id !== "")

          console.log(`📚 Extracted author IDs from relationships:`, authorIds)
          return authorIds
        }

        // Fallback to direct uid field if available
        if (book.uid && Array.isArray(book.uid)) {
          return book.uid.map((item: any) => String(item.target_id || item.value || item)).filter(Boolean)
        }

        console.log(`⚠️ No author IDs found in book structure`)
        return []
      } catch (error) {
        console.warn("⚠️ Error extracting author IDs:", error)
        return []
      }
    }

    // Extract publication ID from relationships
    const getPublicationId = (book: any): string => {
      try {
        if (book.relationships?.lmspublication?.data?.meta?.drupal_internal__target_id) {
          return String(book.relationships.lmspublication.data.meta.drupal_internal__target_id)
        }
        return ""
      } catch (error) {
        console.warn("⚠️ Error extracting publication ID:", error)
        return ""
      }
    }

    // Get basic data
    const id = bookData.id || attributes?.id || attributes?.nid || String(Math.random())
    const title = getValue(attributes.title) || "Unknown Title"
    const copies = getValue(attributes.copies) || "1"
    const totalCopies = Number.parseInt(copies) || 1

    // For now, assume all books are available
    const availableBooks = totalCopies
    const status = availableBooks > 0 ? "available" : "borrowed"

    // Get publication information
    const publicationId = getPublicationId(bookData)
    let publisher = "Unknown Publisher"

    if (publicationId) {
      const publicationData = this.publicationsCache.get(publicationId)
      if (publicationData && publicationData.title) {
        publisher = publicationData.title
        console.log(`✅ Found publisher for book "${title}": ${publisher} (ID: ${publicationId})`)
      } else {
        console.log(`⚠️ Publication ID ${publicationId} not found in cache for book "${title}"`)
        // Try to fetch this publication immediately if not in cache
        this.fetchMissingPublication(bookData.id, publicationId).catch((err) =>
          console.warn(`Failed to fetch missing publication ${publicationId}:`, err.message),
        )
      }
    }

    // Get category information
    const getCategoryId = (book: any): string => {
      try {
        if (book.relationships?.lmsbook_category?.data?.meta?.drupal_internal__target_id) {
          return String(book.relationships.lmsbook_category.data.meta.drupal_internal__target_id)
        }
        return ""
      } catch (error) {
        console.warn("⚠️ Error extracting category ID:", error)
        return ""
      }
    }

    const categoryId = getCategoryId(bookData)
    let category = "General"

    if (categoryId) {
      const categoryData = this.categoriesCache.get(categoryId)
      if (categoryData && categoryData.title) {
        category = categoryData.title
        console.log(`✅ Found category for book "${title}": ${category} (ID: ${categoryId})`)
      } else {
        console.log(`⚠️ Category ID ${categoryId} not found in cache for book "${title}"`)
        // Try to fetch this category immediately if not in cache
        this.fetchMissingCategory(bookData.id, categoryId).catch((err) =>
          console.warn(`Failed to fetch missing category ${categoryId}:`, err.message),
        )
      }
    }

    // Extract details with processed HTML if available
    let description = ""
    try {
      if (attributes.details?.processed) {
        description = attributes.details.processed
      } else if (attributes.details?.value) {
        description = attributes.details.value
      } else {
        description = getValue(attributes.details) || ""
      }
    } catch (error) {
      console.warn("⚠️ Error extracting description:", error)
    }

    // Get price and ISBN
    const price = getValue(attributes.price) || ""
    const isbn = getValue(attributes.isbn) || ""

    // Extract author IDs from the relationships structure
    const authorIds = getAuthorIds(bookData)
    console.log(`📚 Book "${title}" has author IDs:`, authorIds)

    // Default author name (will be replaced if we find author in cache)
    let author = "Unknown Author"

    // Try to enhance author information from authors cache
    if (authorIds.length > 0) {
      const authorNames: string[] = []

      for (const authorId of authorIds) {
        const authorData = this.authorsCache.get(authorId)
        if (authorData && authorData.title) {
          authorNames.push(authorData.title)
          console.log(`✅ Found author for book "${title}": ${authorData.title} (ID: ${authorId})`)
        } else {
          console.log(`⚠️ Author ID ${authorId} not found in cache for book "${title}"`)
          // Try to fetch this author immediately if not in cache
          this.fetchMissingAuthor(authorId).catch((err) =>
            console.warn(`Failed to fetch missing author ${authorId}:`, err.message),
          )
        }
      }

      if (authorNames.length > 0) {
        author = authorNames.join(", ")
      }
    }

    const transformedBook: Book = {
      id: String(id),
      title,
      author,
      isbn,
      category,
      status: status,
      description: description,
      cover_image: getValue(attributes.featured_image) || "",
      publisher,
      price,
      copies: copies,
      books_available: availableBooks,
      books_issued: 0,
      featured_image: getValue(attributes.featured_image) || "",
      details: description,
      lmsbook_category: category,
      lmspublication: publisher,
      uid: authorIds,
    }

    return transformedBook
  }

  // Add a new method to fetch missing authors
  private async fetchMissingAuthor(authorId: string): Promise<void> {
    if (this.authorsCache.has(authorId)) return

    try {
      if (!this.username || !this.password) {
        console.log(`⚠️ Cannot fetch author ${authorId}: no authentication`)
        return
      }

      console.log(`🔍 Fetching missing author ID: ${authorId}`)
      const basicAuth = btoa(`${this.username}:${this.password}`)

      const authorData = await this.makeProxyRequest(`/web/lmsbookauthor/${authorId}?_format=json`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${basicAuth}`,
        },
      })

      if (authorData) {
        const author = this.parseAuthorData(authorData)
        this.authorsCache.set(String(authorId), author)
        console.log(`✅ Fetched missing author: "${author.title}" (ID: ${authorId})`)
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch missing author ${authorId}:`, error.message)
    }
  }

  // Add a new method to fetch missing publications
  private async fetchMissingPublication(bookUuid: string, publicationId: string): Promise<void> {
    if (this.publicationsCache.has(publicationId)) return

    try {
      console.log(`🔍 Fetching missing publication for book UUID: ${bookUuid}`)

      const publicationData = await this.makeProxyRequest(`/web/jsonapi/lmsbook/lmsbook/${bookUuid}/lmspublication`, {
        method: "GET",
        headers: {
          Accept: "application/vnd.api+json",
        },
      })

      if (publicationData && publicationData.data) {
        const publication = this.parsePublicationData(publicationData.data)
        this.publicationsCache.set(String(publication.id), publication)
        console.log(`✅ Fetched missing publication: "${publication.title}" (ID: ${publication.id})`)
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch missing publication for book ${bookUuid}:`, error.message)
    }
  }

  // Add a new method to fetch missing categories
  private async fetchMissingCategory(bookUuid: string, categoryId: string): Promise<void> {
    if (this.categoriesCache.has(categoryId)) return

    try {
      console.log(`🔍 Fetching missing category for book UUID: ${bookUuid}`)

      const categoryData = await this.makeProxyRequest(`/web/jsonapi/lmsbook/lmsbook/${bookUuid}/lmsbook_category`, {
        method: "GET",
        headers: {
          Accept: "application/vnd.api+json",
        },
      })

      if (categoryData && categoryData.data) {
        const category = this.parseCategoryData(categoryData.data)
        this.categoriesCache.set(String(category.id), category)
        console.log(`✅ Fetched missing category: "${category.title}" (ID: ${category.id})`)
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch missing category for book ${bookUuid}:`, error.message)
    }
  }

  // Get all books using JSON API with optional enhanced data from authors API
  async getBooks(params?: {
    search?: string
    searchField?: "title" | "author" | "isbn" | "all"
    category?: string
    author?: string
    page?: number
    limit?: number
  }): Promise<Book[]> {
    console.log("getBooks called with params:", params)

    try {
      // Try to load authors data (failures are OK, we'll continue without enhanced author names)
      try {
        await this.loadAuthors()
      } catch (authorError) {
        console.warn("⚠️ Author loading failed, continuing with basic book data:", authorError.message)
      }

      // Use the JSON API endpoint for listing books
      let endpoint = "/web/jsonapi/lmsbook/lmsbook"

      // Add field selection for better performance
      const fields = "title,uid,isbn,lmsbook_category,lmspublication,copies,price,details,featured_image,author"
      endpoint += `?fields[lmsbook--lmsbook]=${fields}`

      console.log(`🔍 Fetching from JSON API endpoint: ${endpoint}`)

      const result = await this.makeProxyRequest(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/vnd.api+json",
        },
      })

      // Extract book UUIDs for publication loading
      const bookUuids = result.data?.map((book: any) => book.id).filter(Boolean) || []

      // Try to load publications data (failures are OK, we'll continue without enhanced publisher names)
      try {
        await this.loadPublications(bookUuids.slice(0, 10)) // Load first 10 to avoid too many requests
      } catch (publicationError) {
        console.warn("⚠️ Publication loading failed, continuing with basic book data:", publicationError.message)
      }

      // Try to load categories data (failures are OK, we'll continue without enhanced category names)
      try {
        await this.loadCategories(bookUuids.slice(0, 10)) // Load first 10 to avoid too many requests
      } catch (categoryError) {
        console.warn("⚠️ Category loading failed, continuing with basic book data:", categoryError.message)
      }

      // Process JSON API response
      const books = this.processJsonApiResponse(result, params)
      console.log(`✅ Processed ${books.length} books successfully`)

      return books
    } catch (error) {
      console.error("❌ Books API error:", error)
      throw new ApiError(`Failed to fetch books: ${error.message}`, error.status || 500)
    }
  }

  private processJsonApiResponse(result: any, params?: any): Book[] {
    if (!result.data || !Array.isArray(result.data)) {
      console.log("❌ No data array found in response")
      return []
    }

    const booksData = result.data
    console.log(`📚 Processing ${booksData.length} books from JSON API`)

    // Transform the data - pass the complete book object including relationships
    const transformedBooks: Book[] = booksData.map((book: any) => {
      console.log(`🔍 Processing book:`, book.attributes?.title, `with relationships:`, !!book.relationships?.uid)
      return this.transformDrupalBookData(book) // Pass the complete book object
    })

    // Apply client-side filtering after transformation
    let filteredBooks = transformedBooks

    if (params?.search) {
      const searchTerm = params.search.toLowerCase()
      const searchField = params.searchField || "all"

      filteredBooks = filteredBooks.filter((book) => {
        const title = book.title.toLowerCase()
        const isbn = book.isbn?.toLowerCase() || ""
        const author = book.author.toLowerCase()

        // If searchField is specified, only search in that field
        switch (searchField) {
          case "title":
            return title.includes(searchTerm)
          case "author":
            return author.includes(searchTerm)
          case "isbn":
            return isbn.includes(searchTerm)
          case "all":
          default:
            return title.includes(searchTerm) || isbn.includes(searchTerm) || author.includes(searchTerm)
        }
      })
    }

    if (params?.category && params.category !== "all") {
      filteredBooks = filteredBooks.filter((book) => {
        return book.category.toLowerCase() === params.category?.toLowerCase()
      })
    }

    if (params?.author) {
      const authorTerm = params.author.toLowerCase()
      filteredBooks = filteredBooks.filter((book) => book.author.toLowerCase().includes(authorTerm))
    }

    return filteredBooks
  }

  // Get author details by ID
  async getAuthor(authorId: string): Promise<Author> {
    try {
      console.log(`🔍 Fetching author details for ID: ${authorId}`)

      if (!this.username || !this.password) {
        throw new ApiError("Authentication required", 401)
      }

      const basicAuth = btoa(`${this.username}:${this.password}`)

      const authorData = await this.makeProxyRequest(`/web/lmsbookauthor/${authorId}?_format=json`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${basicAuth}`,
        },
      })

      return this.parseAuthorData(authorData)
    } catch (error) {
      throw new ApiError(`Failed to fetch author details: ${error.message}`, error.status || 500)
    }
  }

  // Get publication details by book UUID
  async getPublication(bookUuid: string): Promise<Publication> {
    try {
      console.log(`🔍 Fetching publication details for book UUID: ${bookUuid}`)

      const publicationData = await this.makeProxyRequest(`/web/jsonapi/lmsbook/lmsbook/${bookUuid}/lmspublication`, {
        method: "GET",
        headers: {
          Accept: "application/vnd.api+json",
        },
      })

      if (!publicationData || !publicationData.data) {
        throw new ApiError("No publication data found", 404)
      }

      return this.parsePublicationData(publicationData.data)
    } catch (error) {
      throw new ApiError(`Failed to fetch publication details: ${error.message}`, error.status || 500)
    }
  }

  // Get all cached authors
  async getAuthors(): Promise<Author[]> {
    await this.loadAuthors()
    return Array.from(this.authorsCache.values())
  }

  // Get all cached publications
  async getPublications(): Promise<Publication[]> {
    return Array.from(this.publicationsCache.values())
  }

  // Get all cached categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categoriesCache.values())
  }

  async getBookDetails(bookId: string): Promise<Book> {
    try {
      console.log(`🔍 Fetching book details for ID: ${bookId}`)

      // Load required data first
      await this.loadAuthors()

      const result = await this.makeAuthenticatedRequest(`/web/lmsbook/${bookId}?_format=json`)
      return this.transformDrupalBookData(result)
    } catch (error) {
      throw new ApiError(`Failed to fetch book details: ${error.message}`, error.status || 500)
    }
  }

  async reserveBook(bookId: string): Promise<{ success: boolean; message: string; reservation?: Reservation }> {
    return this.makeAuthenticatedRequest(`/web/books/${bookId}/reserve?_format=json`, {
      method: "POST",
    })
  }

  async cancelReservation(reservationId: string): Promise<{ success: boolean; message: string }> {
    return this.makeAuthenticatedRequest(`/web/reservations/${reservationId}/cancel?_format=json`, {
      method: "POST",
    })
  }

  async getUserReservations(): Promise<Reservation[]> {
    return this.makeAuthenticatedRequest("/web/user/reservations?_format=json")
  }

  async getUserBorrowedBooks(): Promise<BorrowedBook[]> {
    return this.makeAuthenticatedRequest("/web/user/borrowed?_format=json")
  }

  async getUserProfile(): Promise<UserProfile> {
    try {
      return await this.makeAuthenticatedRequest("/web/user/profile?_format=json")
    } catch (error) {
      // If profile endpoint doesn't exist, return mock data
      console.warn("Profile API not available, using mock data")
      return {
        uid: "28",
        name: "Alana Rivers",
        email: "alana.rivers@example.com",
        role: "student",
        credits: 3,
        max_credits: 5,
        borrowed_books_count: 2,
        active_reservations_count: 1,
      }
    }
  }

  async borrowBook(bookId: string): Promise<{ success: boolean; message: string; borrowed_book?: BorrowedBook }> {
    return this.makeAuthenticatedRequest(`/web/books/${bookId}/borrow?_format=json`, {
      method: "POST",
    })
  }

  async returnBook(bookId: string): Promise<{ success: boolean; message: string }> {
    return this.makeAuthenticatedRequest(`/web/books/${bookId}/return?_format=json`, {
      method: "POST",
    })
  }

  async renewBook(bookId: string): Promise<{ success: boolean; message: string; new_due_date?: string }> {
    return this.makeAuthenticatedRequest(`/web/books/${bookId}/renew?_format=json`, {
      method: "POST",
    })
  }

  async checkUserCredits(): Promise<{ available_credits: number; max_credits: number; used_credits: number }> {
    return this.makeAuthenticatedRequest("/web/user/credits?_format=json")
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    return this.makeProxyRequest(`/web/search/suggestions?q=${encodeURIComponent(query)}`)
  }

  async getCategories(): Promise<string[]> {
    console.log("🔍 Getting categories...")
    try {
      // First try to get categories from cached data
      const cachedCategories = Array.from(this.categoriesCache.values())
      if (cachedCategories.length > 0) {
        const categoryNames = cachedCategories.map((cat) => cat.title).filter(Boolean)
        console.log("✅ Categories from cache:", categoryNames)
        return categoryNames
      }

      // Then try to get categories from books data
      const books = await this.getBooks({ limit: 100 })
      const categories = [...new Set(books.map((book) => book.category).filter(Boolean))]

      if (categories.length > 0) {
        console.log("✅ Categories extracted from books:", categories)
        return categories as string[]
      }
    } catch (error) {
      console.log("❌ Failed to extract categories:", error.message)
    }

    // Fallback to default categories
    console.log("🔄 Using default categories")
    return [
      "Fiction",
      "Non-Fiction",
      "Science",
      "History",
      "Biography",
      "Technology",
      "Business",
      "Arts",
      "Philosophy",
      "Religion",
      "General",
    ]
  }

  setUseProxy(useProxy: boolean) {
    this.useProxy = useProxy
    console.log(`API mode changed to: ${useProxy ? "Proxy" : "Direct"}`)
  }

  // Debug method to get all active sessions
  async getActiveSessions(): Promise<any> {
    try {
      const response = await fetch("/api/sessions", {
        method: "GET",
      })
      return await response.json()
    } catch (error) {
      console.error("Failed to get active sessions:", error)
      return { total_sessions: 0, sessions: [] }
    }
  }
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

export const libraryAPI = new LibraryAPI()
export { ApiError }
export type { Book, Author, Publication, Category, UserProfile, Reservation, BorrowedBook, BooksApiResponse }
