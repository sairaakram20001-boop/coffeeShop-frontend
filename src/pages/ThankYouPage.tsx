import { Link, useSearchParams } from 'react-router-dom'

export default function ThankYouPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center">
      <h1 className="text-5xl font-black text-[var(--ink)]">Thank You</h1>
      <p className="mt-4 text-lg text-amber-900/80">
        {orderId ? `Order #${orderId} placed successfully.` : 'Your order has been placed successfully.'}
      </p>
      <Link to="/shop" className="mt-6 rounded-full bg-[var(--rosewood)] px-6 py-3 font-bold text-[var(--ink)]">
        Continue Shopping
      </Link>
    </main>
  )
}

