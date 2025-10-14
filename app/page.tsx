import Link from "next/link"

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">Credit Limit Increase</h1>
        <p className="text-muted-foreground mt-2">
          Choose your card to request a credit limit increase. Each card has different eligibility rules.
        </p>
      </header>

      <nav aria-label="Card navigation" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/visa"
          className="rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <span className="block text-lg font-medium">Visa</span>
          <span className="text-sm text-muted-foreground">Standard criteria</span>
        </Link>
        <Link
          href="/mastercard"
          className="rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <span className="block text-lg font-medium">Mastercard</span>
          <span className="text-sm text-muted-foreground">Balanced criteria</span>
        </Link>
        <Link
          href="/amex"
          className="rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <span className="block text-lg font-medium">American Express</span>
          <span className="text-sm text-muted-foreground">Flexible criteria</span>
        </Link>
      </nav>
    </main>
  )
}
