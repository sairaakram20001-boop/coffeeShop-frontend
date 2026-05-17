import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { useToast } from '../hooks/useToast'
import api from '../services/api'

export default function CheckoutPage() {
  const { items, totalAmount, refreshCart, clearCart } = useCart()
  const { isAuthenticated, userId } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const placeOrder = async () => {
    if (!isAuthenticated || !userId) {
      navigate('/login', { state: { from: '/checkout', message: 'Please login to complete your order.' } })
      return
    }

    const response = await api.post('/api/order/place', { userId })
    const message = String(response.data?.message ?? '')

    if (message.toLowerCase().includes('failed') || message.toLowerCase().includes('empty')) {
      notify(message || 'Could not place order.', 'error')
      return
    }

    await clearCart()
    await refreshCart()
    notify(message || 'Order placed successfully!', 'success')
    navigate('/shop', {
      state: {
        orderSuccess: true,
        orderMessage: message || 'Thanks for your order.',
      },
    })
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-10">
      <h1 className="font-serif text-5xl font-semibold text-[var(--ink)]">Checkout</h1>
      {items.length === 0 ? (
        <Alert message="Your cart is empty. Add items from shop." />
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-2xl border border-[var(--stone)]/40 bg-white p-4">
              <div>
                <p className="font-semibold text-[var(--ink)]">{item.productName}</p>
                <p className="text-sm text-[var(--rosewood)]/80">Qty {item.quantity}</p>
              </div>
              <p className="font-bold text-[var(--ink)]">${item.total.toFixed(2)}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-[var(--stone)]/40 bg-white p-5">
            <p className="text-sm text-[var(--rosewood)]/80">Total Amount</p>
            <p className="text-3xl font-black text-[var(--rosewood)]">${totalAmount.toFixed(2)}</p>
            <Button className="mt-4 w-full" onClick={placeOrder}>Place Order</Button>
          </div>
        </div>
      )}
    </main>
  )
}
