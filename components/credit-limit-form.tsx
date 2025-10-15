"use client"

import type React from "react"
import { track } from "@vercel/analytics"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type CardType = "visa" | "mastercard" | "amex"

interface CreditLimitFormProps {
  card: CardType
  formName?: string
  formId?: string
}

type Decision = { approved: true; approvedLimit: number; message: string } | { approved: false; message: string }

export function CreditLimitForm({ card, formName, formId }: CreditLimitFormProps) {
  const [fullName, setFullName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [currentLimit, setCurrentLimit] = useState<number | "">("")
  const [requestedLimit, setRequestedLimit] = useState<number | "">("")
  const [annualIncome, setAnnualIncome] = useState<number | "">("")
  const [monthlyExpenses, setMonthlyExpenses] = useState<number | "">("")
  const [reason, setReason] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [decision, setDecision] = useState<Decision | null>(null)
  const [error, setError] = useState<string | null>(null)

  function toNumber(value: number | "" | undefined): number {
    const n = typeof value === "number" ? value : Number(value)
    return Number.isFinite(n) ? n : 0
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setDecision(null)

    // Basic client-side validation
    if (!fullName || !accountNumber) {
      setError("Please enter your full name and account number.")
      return
    }

    const payload = {
      card,
      fullName,
      accountNumber,
      currentLimit: toNumber(currentLimit),
      requestedLimit: toNumber(requestedLimit),
      annualIncome: toNumber(annualIncome),
      monthlyExpenses: toNumber(monthlyExpenses),
      reason,
    }

    // Minimal numeric checks to prevent obvious mistakes
    if (
      payload.currentLimit <= 0 ||
      payload.requestedLimit <= 0 ||
      payload.annualIncome <= 0 ||
      payload.monthlyExpenses < 0
    ) {
      setError("Please enter positive amounts for current limit, requested limit, and annual income.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/credit-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = (await res.json()) as Decision & { error?: string }
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        track("credit_limit_submission_failed", {
          card,
          status: res.status,
          error: data.error ?? "unknown",
        })
      } else {
        if ("approved" in data) {
          setDecision(data)
          track("credit_limit_submission", {
            card,
            approved: data.approved,
            requestedLimit: payload.requestedLimit,
            currentLimit: payload.currentLimit,
            annualIncome: payload.annualIncome,
          })
        } else {
          setError("Unexpected response. Please try again.")
          track("credit_limit_submission_unexpected", { card })
        }
      }
    } catch (err) {
      setError("Network error. Please try again.")
      track("credit_limit_submission_error", { card, reason: "network" })
    } finally {
      setSubmitting(false)
    }
  }

  const cardLabel = card === "visa" ? "Visa" : card === "mastercard" ? "Mastercard" : "American Express"
  const resolvedFormName = formName ?? `${card}-form`
  const resolvedFormId = formId ?? resolvedFormName

  return (
    <Card className="border">
      <CardHeader>
        <CardTitle className="text-pretty">{cardLabel} Credit Limit Increase</CardTitle>
        <CardDescription>
          Submit your request. We will evaluate eligibility based on your card&apos;s criteria.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id={resolvedFormId} name={resolvedFormName} onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              required
              autoComplete="name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="accountNumber">Account number</Label>
            <Input
              id="accountNumber"
              name="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="XXXX-XXXX-XXXX"
              inputMode="numeric"
              pattern="[0-9\- ]+"
              required
              aria-describedby="accountNumberHelp"
            />
            <p id="accountNumberHelp" className="text-xs text-muted-foreground">
              Enter digits only; dashes and spaces are allowed.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="currentLimit">Current limit (USD)</Label>
              <Input
                id="currentLimit"
                name="currentLimit"
                type="number"
                min={1}
                step={1}
                value={currentLimit}
                onChange={(e) => setCurrentLimit(e.target.value === "" ? "" : Number(e.target.value))}
                required
                inputMode="decimal"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="requestedLimit">Requested limit (USD)</Label>
              <Input
                id="requestedLimit"
                name="requestedLimit"
                type="number"
                min={1}
                step={1}
                value={requestedLimit}
                onChange={(e) => setRequestedLimit(e.target.value === "" ? "" : Number(e.target.value))}
                required
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="annualIncome">Annual income (USD)</Label>
              <Input
                id="annualIncome"
                name="annualIncome"
                type="number"
                min={1}
                step={1000}
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value === "" ? "" : Number(e.target.value))}
                required
                inputMode="decimal"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="monthlyExpenses">Monthly expenses (USD)</Label>
              <Input
                id="monthlyExpenses"
                name="monthlyExpenses"
                type="number"
                min={0}
                step={50}
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(e.target.value === "" ? "" : Number(e.target.value))}
                required
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <textarea
              id="reason"
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Briefly explain the reason for your request"
              className="w-full rounded-md border border-input bg-background p-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {decision && (
            <div role="status" className="rounded-md border bg-secondary p-3 text-secondary-foreground">
              <p className="font-medium">{decision.approved ? "Approved" : "Not Approved"}</p>
              <p className="text-sm text-muted-foreground">{decision.message}</p>
              {"approvedLimit" in decision && (
                <p className="mt-1 text-sm">New limit: ${decision.approvedLimit.toLocaleString()}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
            <p className="text-xs text-muted-foreground">Processing uses card-specific criteria for fair decisions.</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
