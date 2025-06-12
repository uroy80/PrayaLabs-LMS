"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar, Clock } from "lucide-react"

export function BorrowedBooks() {
  const borrowedBooks = [
    {
      id: 1,
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      borrowDate: "2024-01-15",
      dueDate: "2024-01-29",
      status: "borrowed",
    },
    {
      id: 2,
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      borrowDate: "2024-01-10",
      dueDate: "2024-01-24",
      status: "overdue",
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            Currently Borrowed Books
          </CardTitle>
          <CardDescription>Books you have checked out from the library</CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {borrowedBooks.map((book) => (
          <Card key={book.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{book.title}</h3>
                  <p className="text-gray-600">by {book.author}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      Borrowed: {book.borrowDate}
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      Due: {book.dueDate}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge variant={book.status === "overdue" ? "destructive" : "secondary"}>
                    {book.status === "overdue" ? "Overdue" : "Active"}
                  </Badge>
                  <Button size="sm" variant="outline">
                    Renew
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
