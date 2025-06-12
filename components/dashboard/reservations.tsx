"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock } from "lucide-react"

export function Reservations() {
  const reservations = [
    {
      id: 1,
      title: "1984",
      author: "George Orwell",
      reservedAt: "2024-01-20 10:30",
      expiresAt: "2024-01-20 14:30",
      status: "active",
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            My Reservations
          </CardTitle>
          <CardDescription>Books you have reserved (4-hour limit)</CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {reservations.map((reservation) => (
          <Card key={reservation.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{reservation.title}</h3>
                  <p className="text-gray-600">by {reservation.author}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      Reserved: {reservation.reservedAt}
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      Expires: {reservation.expiresAt}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge variant="secondary">Active</Badge>
                  <div className="flex space-x-2">
                    <Button size="sm">Collect</Button>
                    <Button size="sm" variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
