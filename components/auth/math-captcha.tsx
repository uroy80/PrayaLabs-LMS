"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, Calculator, Shield } from "lucide-react"

interface MathCaptchaProps {
  onVerify: (isValid: boolean) => void
  disabled?: boolean
}

export function MathCaptcha({ onVerify, disabled = false }: MathCaptchaProps) {
  const [question, setQuestion] = useState<string>("")
  const [answer, setAnswer] = useState<number>(0)
  const [userAnswer, setUserAnswer] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    generateQuestion()
  }, [])

  const generateQuestion = () => {
    const operations = ["+", "-", "*"]
    const operation = operations[Math.floor(Math.random() * operations.length)]

    let num1: number, num2: number, correctAnswer: number, questionText: string

    switch (operation) {
      case "+":
        num1 = Math.floor(Math.random() * 50) + 1
        num2 = Math.floor(Math.random() * 50) + 1
        correctAnswer = num1 + num2
        questionText = `${num1} + ${num2} = ?`
        break
      case "-":
        num1 = Math.floor(Math.random() * 50) + 20
        num2 = Math.floor(Math.random() * (num1 - 1)) + 1
        correctAnswer = num1 - num2
        questionText = `${num1} - ${num2} = ?`
        break
      case "*":
        num1 = Math.floor(Math.random() * 10) + 1
        num2 = Math.floor(Math.random() * 10) + 1
        correctAnswer = num1 * num2
        questionText = `${num1} × ${num2} = ?`
        break
      default:
        num1 = 2
        num2 = 3
        correctAnswer = 5
        questionText = "2 + 3 = ?"
    }

    setQuestion(questionText)
    setAnswer(correctAnswer)
    setUserAnswer("")
    setError("")
    setIsVerified(false)
    onVerify(false)
  }

  const verifyAnswer = () => {
    if (!userAnswer.trim()) {
      setError("Please enter your answer")
      return
    }

    const userNum = Number.parseInt(userAnswer.trim())

    if (isNaN(userNum)) {
      setError("Please enter a valid number")
      setIsVerified(false)
      onVerify(false)
      return
    }

    if (userNum === answer) {
      setError("")
      setIsVerified(true)
      onVerify(true)
    } else {
      setError("Incorrect answer. Please try again.")
      setIsVerified(false)
      onVerify(false)
      generateQuestion()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4 text-blue-900" />
        <Label htmlFor="math-captcha" className="text-sm font-medium text-gray-900">
          Mathematical Verification
        </Label>
        {isVerified && (
          <span className="text-xs text-green-700 font-medium bg-green-100 px-2 py-1 rounded">✓ Verified</span>
        )}
      </div>

      <Card className="border-2 border-gray-200">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Math Question Display */}
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center">
                <div className="text-2xl font-mono bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-4 rounded-lg">
                  <Calculator className="h-5 w-5 inline mr-3 text-blue-600" />
                  <span className="font-bold text-gray-800">{question}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateQuestion}
                disabled={disabled}
                title="Generate new question"
                className="h-16 w-16 flex-shrink-0"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>

            {/* Answer Input and Verification */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="math-answer" className="text-sm text-gray-700">
                  Enter your answer
                </Label>
                <Input
                  id="math-answer"
                  type="number"
                  placeholder="Enter the result"
                  value={userAnswer}
                  onChange={(e) => {
                    setUserAnswer(e.target.value)
                    setError("")
                    setIsVerified(false)
                    onVerify(false)
                  }}
                  disabled={disabled}
                  className="text-center text-lg h-12 border-2 border-gray-300 focus:border-blue-500"
                />
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</div>}

              {isVerified && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Calculation verified! You may proceed.
                </div>
              )}

              <Button
                type="button"
                onClick={verifyAnswer}
                disabled={disabled || !userAnswer.trim()}
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-medium"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Verify Calculation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded border">
        <strong>Security Notice:</strong> Solve the mathematical equation above to verify you are human.
      </div>
    </div>
  )
}
