"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookOpen, DollarSign, Package, Building2, Hash, Tag, Users, BookCheck } from "lucide-react"
import type { Book } from "@/lib/api"

interface BookDetailsModalProps {
  book: Book | null
  isOpen: boolean
  onClose: () => void
  onReserve: (bookId: string) => void
  loading?: boolean
}

export function BookDetailsModal({ book, isOpen, onClose, onReserve, loading = false }: BookDetailsModalProps) {
  if (!book) return null

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase()
    switch (normalizedStatus) {
      case "available":
        return "bg-green-100 text-green-800"
      case "borrowed":
        return "bg-red-100 text-red-800"
      case "reserved":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    const normalizedStatus = status?.toLowerCase()
    switch (normalizedStatus) {
      case "available":
        return "Available"
      case "borrowed":
        return "Borrowed"
      case "reserved":
        return "Reserved"
      default:
        return status || "Available"
    }
  }

  const isBookAvailable = (status: string) => {
    const normalizedStatus = status?.toLowerCase()
    return normalizedStatus === "available" || !status
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold pr-4">{book.title}</DialogTitle>
              <DialogDescription className="text-base mt-1">by {book.author}</DialogDescription>
            </div>
            <Badge className={getStatusColor(book.status)}>{getStatusText(book.status)}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {book.isbn && (
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">ISBN:</span>
                <span className="text-sm">{book.isbn}</span>
              </div>
            )}

            {book.category && (
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Category:</span>
                <span className="text-sm">{book.category}</span>
              </div>
            )}

            {book.publisher && (
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Publisher:</span>
                <span className="text-sm">{book.publisher}</span>
              </div>
            )}

            {book.price && (
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Price:</span>
                <span className="text-sm font-semibold text-green-600">₹{book.price}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Availability Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Book Availability
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {book.copies && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">Total Copies</div>
                  <div className="text-2xl font-bold text-blue-600">{book.copies}</div>
                  <div className="text-xs text-blue-600">Total inventory</div>
                </div>
              )}

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-green-800">Available to Borrow</div>
                <div className="text-2xl font-bold text-green-600">{book.books_available || 0}</div>
                <div className="text-xs text-green-600">Books in library</div>
              </div>

              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-red-800">Currently Borrowed</div>
                <div className="text-2xl font-bold text-red-600">{book.books_issued || 0}</div>
                <div className="text-xs text-red-600">Books issued to students</div>
              </div>
            </div>

            {book.total_issued_books && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded flex items-center">
                <BookCheck className="h-4 w-4 mr-2" />
                <strong>Status:</strong>&nbsp;{book.total_issued_books}
              </div>
            )}

            {/* Availability Summary */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">Availability Summary</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-blue-700">
                {book.books_available && book.books_available > 0 ? (
                  <span className="text-green-700 font-medium">
                    ✅ {book.books_available} book{book.books_available !== 1 ? "s" : ""} available to borrow
                  </span>
                ) : (
                  <span className="text-red-700 font-medium">
                    ❌ No books available - All {book.books_issued || 0} copies are currently borrowed by students
                  </span>
                )}
              </div>
            </div>
          </div>

          {book.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="text-gray-700 leading-relaxed">{book.description}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1"
              disabled={!isBookAvailable(book.status) || loading || (book.books_available || 0) === 0}
              onClick={() => onReserve(book.id)}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {isBookAvailable(book.status) && (book.books_available || 0) > 0 ? "Reserve Book" : "Not Available"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          {(book.books_available || 0) === 0 && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded flex items-center">
              <BookCheck className="h-4 w-4 mr-2" />
              <div>
                <strong>Note:</strong> All copies are currently borrowed by students.
                {book.books_issued && book.books_issued > 0 && (
                  <span>
                    {" "}
                    {book.books_issued} book{book.books_issued !== 1 ? "s are" : " is"} currently issued.
                  </span>
                )}{" "}
                Please check back later or contact the library.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
