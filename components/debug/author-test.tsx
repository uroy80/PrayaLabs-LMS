"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, User, Calendar, Building2 } from "lucide-react"
import { libraryAPI } from "@/lib/api"

export function AuthorTest() {
  const { user } = useAuth()
  const [authorId, setAuthorId] = useState("13")
  const [bookUuid, setBookUuid] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [authors, setAuthors] = useState<any[]>([])
  const [publications, setPublications] = useState<any[]>([])

  // Update the AuthorTest component to show the drupal_internal__target_id
  const testAuthorEndpoint = async () => {
    if (!user) {
      setError("Authentication required. Please log in with valid credentials.")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const author = await libraryAPI.getAuthor(authorId)
      setResult(author)
      console.log("✅ Author test successful:", author)
    } catch (err) {
      console.error("❌ Author test failed:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Test publication endpoint
  const testPublicationEndpoint = async () => {
    if (!user) {
      setError("Authentication required. Please log in with valid credentials.")
      return
    }

    if (!bookUuid.trim()) {
      setError("Please enter a book UUID")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const publication = await libraryAPI.getPublication(bookUuid)
      setResult(publication)
      console.log("✅ Publication test successful:", publication)
    } catch (err) {
      console.error("❌ Publication test failed:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Add a new function to test author-book relationships
  const testAuthorBookRelationship = async () => {
    if (!user) {
      setError("Authentication required. Please log in with valid credentials.")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // First get a book
      const books = await libraryAPI.getBooks({ limit: 5 })
      if (books.length === 0) {
        setError("No books found to test relationships")
        setLoading(false)
        return
      }

      const testBook = books[0]
      const authorIds = testBook.uid || []

      const results = {
        book: testBook,
        authorIds: authorIds,
        authors: [] as any[],
        publisher: testBook.publisher,
      }

      // Try to fetch each author
      for (const authorId of authorIds) {
        try {
          const author = await libraryAPI.getAuthor(authorId)
          results.authors.push({
            id: authorId,
            success: true,
            data: author,
          })
        } catch (err) {
          results.authors.push({
            id: authorId,
            success: false,
            error: err.message,
          })
        }
      }

      setResult(results)
      console.log("✅ Author-Book relationship test:", results)
    } catch (err) {
      console.error("❌ Author-Book relationship test failed:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const loadAllAuthors = async () => {
    if (!user?.username || !user?.password) {
      setError("Authentication required. Please log in with valid credentials.")
      return
    }

    setLoading(true)
    setError(null)
    setAuthors([])

    try {
      const authorsList = await libraryAPI.getAuthors()
      setAuthors(authorsList)
      console.log("✅ Authors loaded:", authorsList)
    } catch (err) {
      console.error("❌ Authors loading failed:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const loadAllPublications = async () => {
    if (!user?.username || !user?.password) {
      setError("Authentication required. Please log in with valid credentials.")
      return
    }

    setLoading(true)
    setError(null)
    setPublications([])

    try {
      const publicationsList = await libraryAPI.getPublications()
      setPublications(publicationsList)
      console.log("✅ Publications loaded:", publicationsList)
    } catch (err) {
      console.error("❌ Publications loading failed:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const testSpecificAuthorIds = async () => {
    if (!user?.username || !user?.password) {
      setError("Authentication required. Please log in with valid credentials.")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    const testIds = ["13", "8", "1", "2", "3", "4", "5"]
    const results = []

    try {
      for (const id of testIds) {
        try {
          const author = await libraryAPI.getAuthor(id)
          results.push({ id, success: true, data: author })
          console.log(`✅ Author ${id} found:`, author.title)
        } catch (err) {
          results.push({ id, success: false, error: err.message })
          console.log(`❌ Author ${id} failed:`, err.message)
        }
      }

      setResult(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Add this new function after the existing test functions
  const testBookStructure = async () => {
    if (!user) {
      setError("Authentication required. Please log in with valid credentials.")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Get raw book data to examine structure
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: "/web/jsonapi/lmsbook/lmsbook?page[limit]=3",
          method: "GET",
          headers: {
            Accept: "application/vnd.api+json",
          },
        }),
      })

      const result = await response.json()

      if (result.success && result.data?.data) {
        const books = result.data.data
        const bookStructures = books.map((book: any) => ({
          id: book.id,
          title: book.attributes?.title,
          hasRelationships: !!book.relationships,
          hasUidRelationship: !!book.relationships?.uid,
          hasPublicationRelationship: !!book.relationships?.lmspublication,
          uidData: book.relationships?.uid?.data,
          publicationData: book.relationships?.lmspublication?.data,
          authorIds: book.relationships?.uid?.data?.map((author: any) => author.meta?.drupal_internal__target_id) || [],
          publicationId: book.relationships?.lmspublication?.data?.meta?.drupal_internal__target_id || null,
        }))

        setResult({
          type: "book_structure",
          books: bookStructures,
          rawSample: books[0], // Include first book for detailed inspection
        })

        console.log("📚 Book structure analysis:", bookStructures)
      } else {
        setError("Failed to fetch book structure data")
      }
    } catch (err) {
      console.error("❌ Book structure test failed:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Author & Publication API Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authentication Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Authentication Status:</span>
            {user?.username && user?.password ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Authenticated as {user.username}
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Not Authenticated
              </Badge>
            )}
          </div>

          {/* Test Single Author */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Single Author</label>
            <div className="flex gap-2">
              <Input
                placeholder="Author ID (e.g., 13)"
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="flex-1"
              />
              <Button onClick={testAuthorEndpoint} disabled={loading || !user?.username} className="min-w-[120px]">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    Test Author
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Test Single Publication */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Single Publication</label>
            <div className="flex gap-2">
              <Input
                placeholder="Book UUID (e.g., 866211a4-1d92-4d43-b40f-010da229a54c)"
                value={bookUuid}
                onChange={(e) => setBookUuid(e.target.value)}
                className="flex-1"
              />
              <Button onClick={testPublicationEndpoint} disabled={loading || !user?.username} className="min-w-[120px]">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    Test Publication
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Test Multiple Authors */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={testSpecificAuthorIds}
              disabled={loading || !user?.username}
              variant="outline"
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Multiple Author IDs"
              )}
            </Button>

            <Button onClick={loadAllAuthors} disabled={loading || !user?.username} variant="outline" className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load All Authors"
              )}
            </Button>

            <Button
              onClick={loadAllPublications}
              disabled={loading || !user?.username}
              variant="outline"
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load Publications"
              )}
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={testAuthorBookRelationship}
              disabled={loading || !user?.username}
              variant="outline"
              className="flex-1"
            >
              Test Book-Author Link
            </Button>

            <Button
              onClick={testBookStructure}
              disabled={loading || !user?.username}
              variant="outline"
              className="flex-1"
            >
              Debug Book Structure
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Single Author/Publication Result */}
          {result && !Array.isArray(result) && !Array.isArray(authors) && !(result?.type === "book_structure") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {result.description !== undefined ? (
                    <>
                      <Building2 className="h-5 w-5" />
                      {result.title} (Publication)
                    </>
                  ) : (
                    <>
                      <User className="h-5 w-5" />
                      {result.title} (Author)
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">ID:</span> {result.id}
                  </div>
                  {result.uuid && (
                    <div>
                      <span className="font-medium">UUID:</span> {result.uuid}
                    </div>
                  )}
                  {result.created && (
                    <div className="col-span-2">
                      <span className="font-medium">Created:</span> {formatDate(result.created)}
                    </div>
                  )}
                </div>
                {result.description && (
                  <div>
                    <span className="font-medium">Description:</span>
                    <div
                      className="mt-1 p-2 bg-gray-50 rounded text-sm"
                      dangerouslySetInnerHTML={{ __html: result.description }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Multiple Authors Test Results */}
          {result && Array.isArray(result) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Multiple Author Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">Author ID {item.id}:</span>
                      {item.success ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">{item.data.title}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-600 text-sm">{item.error}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Authors List */}
          {authors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">All Authors ({authors.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {authors.map((author, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{author.title}</div>
                          <div className="text-sm text-gray-600">ID: {author.id}</div>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(author.created)}
                        </div>
                      </div>
                      {author.description && (
                        <div
                          className="mt-2 text-sm text-gray-700"
                          dangerouslySetInnerHTML={{ __html: author.description }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Publications List */}
          {publications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">All Publications ({publications.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {publications.map((publication, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{publication.title}</div>
                          <div className="text-sm text-gray-600">ID: {publication.id}</div>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Publisher
                        </div>
                      </div>
                      {publication.description && (
                        <div
                          className="mt-2 text-sm text-gray-700"
                          dangerouslySetInnerHTML={{ __html: publication.description }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Book Structure Analysis Result */}
          {result && result.type === "book_structure" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Book Structure Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.books.map((book: any, index: number) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="font-medium">{book.title}</div>
                      <div className="text-sm text-gray-600">UUID: {book.id}</div>
                      <div className="text-sm">
                        <span className="font-medium">Has Relationships:</span>{" "}
                        {book.hasRelationships ? "✅ Yes" : "❌ No"}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Has UID Relationship:</span>{" "}
                        {book.hasUidRelationship ? "✅ Yes" : "❌ No"}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Has Publication Relationship:</span>{" "}
                        {book.hasPublicationRelationship ? "✅ Yes" : "❌ No"}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Author IDs:</span>{" "}
                        {book.authorIds.length > 0 ? book.authorIds.join(", ") : "None found"}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Publication ID:</span> {book.publicationId || "None found"}
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <div className="font-medium mb-2">Raw Sample Book Data:</div>
                    <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(result.rawSample, null, 2)}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Information */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Author API:</strong> <code>/web/lmsbookauthor/{"{id}"}?_format=json</code>
              <br />
              <strong>Publication API:</strong> <code>/web/jsonapi/lmsbook/lmsbook/{"{book_uuid}"}/lmspublication</code>
              <br />
              <strong>Authentication:</strong> HTTP Basic Auth for authors, JSON API for publications
              <br />
              <strong>Response Format:</strong> Drupal field array format for authors, JSON API format for publications
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
