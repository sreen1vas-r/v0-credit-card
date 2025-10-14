import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { feedback, context } = (await req.json()) as { feedback?: string; context?: string }
    if (!feedback || !feedback.trim()) {
      return NextResponse.json({ error: "Feedback is required" }, { status: 400 })
    }
    // Optional: cap length for prototype safety
    if (feedback.length > 2000) {
      return NextResponse.json({ error: "Feedback too long" }, { status: 400 })
    }

    console.log("[v0] Feedback received:", { context, length: feedback.length })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}
