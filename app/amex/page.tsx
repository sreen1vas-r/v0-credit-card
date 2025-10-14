import Link from "next/link"
import { CreditLimitForm } from "@/components/credit-limit-form"
import { FeedbackBox } from "@/components/feedback-box"

export default function AmexPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">American Express</h1>
        <Link href="/" className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground">
          Back to cards
        </Link>
      </header>
      <CreditLimitForm card="amex" />
      <FeedbackBox context="amex" />
    </main>
  )
}
