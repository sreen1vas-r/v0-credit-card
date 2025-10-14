"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { track } from "@vercel/analytics"

interface FeedbackBoxProps {
  context: "visa" | "mastercard" | "amex"
}

export function FeedbackBox({ context }: FeedbackBoxProps) {
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<null | { ok: boolean; message: string }>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)

    if (!feedback.trim()) {
      setStatus({ ok: false, message: "Please enter your feedback before submitting." })
      return
    }

    setSubmitting(true)
    try {
      // Prototype: log to console and send to stub endpoint
      console.log("[v0] Feedback submitted:", { context, feedback })
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback, context }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setStatus({ ok: false, message: data?.error || "Could not submit feedback. Please try again." })
        track("feedback_submit_failed", { context, status: res.status })
      } else {
        setStatus({ ok: true, message: "Thanks for the feedback!" })
        setFeedback("")
        track("feedback_submitted", { context, length: feedback.length })
      }
    } catch {
      setStatus({ ok: false, message: "Network error. Please try again." })
      track("feedback_submit_error", { context })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border mt-8">
      <CardHeader>
        <CardTitle className="text-pretty text-lg">Feedback</CardTitle>
        <CardDescription>Tell us how we can improve this experience.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-3" noValidate>
          <div className="grid gap-2">
            <Label htmlFor={`feedback-${context}`}>Feedback</Label>
            <Textarea
              id={`feedback-${context}`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="Share your thoughts..."
            />
          </div>
          {status && (
            <p className={`text-sm ${status.ok ? "text-muted-foreground" : "text-destructive"}`}>{status.message}</p>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
            <p className="text-xs text-muted-foreground">Feedback helps us refine our card experiences.</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
