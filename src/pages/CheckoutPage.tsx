import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { useToast } from '../hooks/useToast'
import api, { resolveImageUrl } from '../services/api'

export default function CheckoutPage() {
  const { items, totalAmount, refreshCart, setIsOpen } = useCart()
  const { isAuthenticated, userId } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [deliveryType, setDeliveryType] = useState<'Pickup' | 'Delivery'>('Pickup')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const city = 'Lahore'
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fee = useMemo(() => (deliveryType === 'Delivery' ? 1.5 : 0), [deliveryType])
  const total = useMemo(() => totalAmount + fee, [totalAmount, fee])

  const openEditCart = () => {
    navigate('/shop')
    setTimeout(() => setIsOpen(true), 100)
  }

  const placeOrder = async () => {
    if (!isAuthenticated || !userId) {
      navigate('/login', { state: { from: '/checkout', message: 'Please login to complete your order.' } })
      return
    }
    if (items.length === 0) {
      setError('Cart is empty.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await api.post('/api/order/place', {
        userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: addressLine1.trim(),
        fullAddress: `${addressLine1.trim()} ${addressLine2.trim()} ${city.trim()}`.trim(),
        addressLine2: addressLine2.trim(),
        city: city.trim(),
        phoneNumber: (phoneNumber ?? '').trim(),
      })

      await refreshCart()
      notify(String(response.data?.message ?? 'Order placed successfully.'), 'success')
      navigate('/shop', { state: { orderSuccess: true, orderMessage: response.data?.message } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not place order.'
      setError(message)
      notify(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <button onClick={openEditCart} className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--rosewood)]">
        Edit Cart
      </button>
      <h1 className="mt-3 font-serif text-5xl font-semibold text-[var(--ink)]">Finalize Your Order</h1>
      <p className="mt-2 text-[var(--rosewood)]/80">Review your details and complete your morning ritual.</p>

      {error && <div className="mt-5"><Alert message={error} type="error" /></div>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-serif text-4xl text-[var(--ink)]">Delivery or Pickup?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button onClick={() => setDeliveryType('Pickup')} className={`rounded-xl border p-4 text-left ${deliveryType === 'Pickup' ? 'border-[var(--ink)]' : 'border-[var(--stone)]/40'}`}>
                <p className="font-semibold text-[var(--ink)]">Pickup</p>
                <p className="text-xs text-[var(--rosewood)]/80">Ready in 10-15 min</p>
              </button>
              <button onClick={() => setDeliveryType('Delivery')} className={`rounded-xl border p-4 text-left ${deliveryType === 'Delivery' ? 'border-[var(--ink)]' : 'border-[var(--stone)]/40'}`}>
                <p className="font-semibold text-[var(--ink)]">Delivery</p>
                <p className="text-xs text-[var(--rosewood)]/80">Est. 25-35 min</p>
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-serif text-4xl text-[var(--ink)]">Your Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-[var(--rosewood)]/90">First Name</label>
                <input className="input mt-1" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold text-[var(--rosewood)]/90">Last Name</label>
                <input className="input mt-1" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-[var(--rosewood)]/90">Address Line 1</label>
                <input className="input mt-1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-[var(--rosewood)]/90">Address Line 2</label>
                <input className="input mt-1" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold text-[var(--rosewood)]/90">City</label>
                <input className="input mt-1" value={city} readOnly />
              </div>
              <div>
                <label className="text-sm font-semibold text-[var(--rosewood)]/90">Phone Number</label>
                <PhoneInput
                  international
                  defaultCountry="PK"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  className="input mt-1"
                />
              </div>
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="font-serif text-4xl text-[var(--ink)]">Order Summary</h3>
          <div className="mt-4 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 border-b border-[var(--stone)]/30 pb-3">
                <img src={resolveImageUrl(item.imageUrl) ?? ''} alt={item.productName} className="h-12 w-12 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[var(--ink)]">{item.productName}</p>
                  <p className="text-xs text-[var(--rosewood)]/80">Qty {item.quantity}</p>
                </div>
                <p className="font-bold text-[var(--ink)]">${item.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between text-[var(--rosewood)]/90"><span>Subtotal</span><span>${totalAmount.toFixed(2)}</span></div>
            <div className="flex items-center justify-between text-[var(--rosewood)]/90"><span>{deliveryType === 'Pickup' ? 'Pickup Fee' : 'Delivery Fee'}</span><span>{fee === 0 ? 'FREE' : `$${fee.toFixed(2)}`}</span></div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[var(--stone)]/30 pt-3">
            <span className="font-serif text-4xl text-[var(--ink)]">Total</span>
            <span className="text-4xl font-black text-[var(--ink)]">${total.toFixed(2)}</span>
          </div>
          <Button className="mt-5 w-full bg-[#c61b1b] text-white hover:bg-[#a21414]" onClick={placeOrder} disabled={loading || items.length === 0}>
            {loading ? 'Placing...' : 'Place My Order'}
          </Button>
        </aside>
      </div>
    </main>
  )
}
