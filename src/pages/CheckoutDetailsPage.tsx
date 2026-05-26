import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { useToast } from '../hooks/useToast'
import api from '../services/api'

type SummaryItem = {
  id: number
  productName: string
  quantity: number
  total: number
}

type CheckoutDetailsState = {
  orderId?: number
  items?: SummaryItem[]
  totalAmount?: number
} | null

export default function CheckoutDetailsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { notify } = useToast()
  const state = location.state as CheckoutDetailsState

  const orderId = state?.orderId
  const items = state?.items ?? []
  const totalAmount = state?.totalAmount ?? 0

  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [city, setCity] = useState('Lahore')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const phoneIsValid = useMemo(() => {
    const digitsOnly = phoneNumber.replace(/\D/g, '')
    return digitsOnly.length >= 10 && digitsOnly.length <= 15
  }, [phoneNumber])

  const addressIsValid = address.trim().length >= 10

  const validateForm = () => {
    if (!fullName.trim()) return 'Full Name is required.'
    if (!addressIsValid) return 'Address must be at least 10 characters.'
    if (!phoneIsValid) return 'Phone number is invalid.'
    if (city !== 'Lahore') return 'Only Lahore is allowed.'
    return null
  }

  const confirmOrder = async (event: FormEvent) => {
    event.preventDefault()
    if (!orderId) {
      setError('Order reference is missing. Please create order from checkout again.')
      return
    }

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      const response = await api.post(`/api/order/confirm/${orderId}`, {
        fullName: fullName.trim(),
        address: address.trim(),
        phoneNumber: phoneNumber.trim(),
        city,
      })

      const message = String(response.data?.message ?? 'Order confirmed successfully.')
      notify(message, 'success')
      navigate('/shop', {
        state: {
          orderSuccess: true,
          orderMessage: message,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not confirm order.'
      setError(message)
      notify(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const cancelOrder = async () => {
    if (!orderId) {
      navigate('/shop')
      return
    }

    try {
      setSubmitting(true)
      const response = await api.post(`/api/order/cancel/${orderId}`)
      const message = String(response.data?.message ?? 'Order cancelled successfully.')
      notify(message, 'success')
      navigate('/shop')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not cancel order.'
      setError(message)
      notify(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-10">
      <h1 className="font-serif text-5xl font-semibold text-[var(--ink)]">Finalize Your Order</h1>
      <p className="mt-2 text-[var(--rosewood)]/80">Review your details and complete your order.</p>

      {!orderId && (
        <div className="mt-6">
          <Alert message="Order reference missing. Please place order from cart/checkout first." type="error" />
        </div>
      )}
      {error && (
        <div className="mt-6">
          <Alert message={error} type="error" />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={confirmOrder} className="rounded-3xl border border-[var(--stone)]/40 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-3xl text-[var(--ink)]">Checkout Details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-[var(--rosewood)]/90">Full Name</label>
              <input className="input mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-[var(--rosewood)]/90">Address</label>
              <input className="input mt-1" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-semibold text-[var(--rosewood)]/90">Phone Number</label>
              <input className="input mt-1" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-semibold text-[var(--rosewood)]/90">City</label>
              <select className="input mt-1" value={city} onChange={(e) => setCity(e.target.value)} required>
                <option value="Lahore">Lahore</option>
              </select>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button type="submit" className="w-full" disabled={submitting || !orderId}>
              {submitting ? 'Processing...' : 'Place My Order'}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={cancelOrder} disabled={submitting}>
              Cancel Order
            </Button>
          </div>
        </form>

        <aside className="rounded-3xl border border-[var(--stone)]/40 bg-white p-6 shadow-sm">
          <h3 className="font-serif text-3xl text-[var(--ink)]">Order Summary</h3>
          <div className="mt-4 space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-[var(--rosewood)]/80">No preview items available.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-[var(--stone)]/30 pb-2">
                  <div>
                    <p className="font-semibold text-[var(--ink)]">{item.productName}</p>
                    <p className="text-xs text-[var(--rosewood)]/80">Qty {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-[var(--ink)]">${item.total.toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 rounded-2xl bg-[var(--porcelain)] p-4">
            <p className="text-sm text-[var(--rosewood)]/80">Total</p>
            <p className="text-3xl font-black text-[var(--ink)]">${totalAmount.toFixed(2)}</p>
          </div>
        </aside>
      </div>
    </main>
  )
}
