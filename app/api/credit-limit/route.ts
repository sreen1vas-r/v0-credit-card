import { NextResponse } from "next/server"

type CardType = "visa" | "mastercard" | "amex"

interface Payload {
  card: CardType
  fullName: string
  accountNumber: string
  currentLimit: number
  requestedLimit: number
  annualIncome: number
  monthlyExpenses: number
  reason?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Payload>

    // Basic validation
    const requiredFields: Array<keyof Payload> = [
      "card",
      "fullName",
      "accountNumber",
      "currentLimit",
      "requestedLimit",
      "annualIncome",
      "monthlyExpenses",
    ]

    for (const field of requiredFields) {
      if (
        body[field] === undefined ||
        body[field] === null ||
        (typeof body[field] === "string" && (body[field] as string).trim() === "")
      ) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 })
      }
    }

    const card = body.card as CardType
    if (!["visa", "mastercard", "amex"].includes(card)) {
      return NextResponse.json({ error: "Invalid card type" }, { status: 400 })
    }

    const currentLimit = Number(body.currentLimit)
    const requestedLimit = Number(body.requestedLimit)
    const annualIncome = Number(body.annualIncome)
    const monthlyExpenses = Number(body.monthlyExpenses)

    if (
      !Number.isFinite(currentLimit) ||
      !Number.isFinite(requestedLimit) ||
      !Number.isFinite(annualIncome) ||
      !Number.isFinite(monthlyExpenses)
    ) {
      return NextResponse.json({ error: "Invalid numeric values" }, { status: 400 })
    }

    if (currentLimit <= 0 || requestedLimit <= 0 || annualIncome <= 0 || monthlyExpenses < 0) {
      return NextResponse.json(
        { error: "Numeric values must be positive (expenses can be 0 or more)" },
        { status: 400 },
      )
    }

    // Universal guard: cannot request more than 3x current limit
    if (requestedLimit > currentLimit * 3) {
      return NextResponse.json(
        {
          approved: false,
          message: "Requested limit exceeds 3x your current limit, which is outside our maximum increase policy.",
        },
        { status: 200 },
      )
    }

    // Compute DTI (debt-to-income) using monthly perspective
    const monthlyIncome = annualIncome / 12
    const dti = monthlyIncome > 0 ? monthlyExpenses / monthlyIncome : 1

    // Card-specific thresholds
    const rules: Record<CardType, { maxDTI: number; capMultiplier: number }> = {
      visa: { maxDTI: 0.4, capMultiplier: 1.5 },
      mastercard: { maxDTI: 0.45, capMultiplier: 1.75 },
      amex: { maxDTI: 0.5, capMultiplier: 2.0 },
    }

    const { maxDTI, capMultiplier } = rules[card]
    const maxAllowed = Math.floor(currentLimit * capMultiplier)

    if (dti > maxDTI) {
      return NextResponse.json(
        {
          approved: false,
          message: `Your current debt-to-income ratio (${(dti * 100).toFixed(1)}%) exceeds the ${(maxDTI * 100).toFixed(
            0,
          )}% limit for this card.`,
        },
        { status: 200 },
      )
    }

    if (requestedLimit > maxAllowed) {
      return NextResponse.json(
        {
          approved: false,
          message: `For this card, the maximum allowable limit is $${maxAllowed.toLocaleString()}. Please request a lower amount.`,
        },
        { status: 200 },
      )
    }

    // If all checks pass, approve
    return NextResponse.json(
      {
        approved: true,
        approvedLimit: requestedLimit,
        message: "Your request meets the criteria for this card. Your new limit will appear on your account shortly.",
      },
      { status: 200 },
    )
  } catch (err) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 })
  }
}
