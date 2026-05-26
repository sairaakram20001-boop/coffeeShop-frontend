import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Alert from '../components/Alert'
import api, { resolveImageUrl } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { useCart } from '../hooks/useCart'

type OrderItem = {
  productId: number
  productName: string
  productImageUrl?: string
  quantity: number
  price: number
  subTotal: number
}

type OrderRecord = {
  id: number
  status: string
  totalAmount: number
  firstName?: string
  lastName?: string
  address?: string
  addressLine2?: string
  fullAddress?: string
  city?: string
  phoneNumber?: string
  confirmedAt?: string
  createdAt: string
  updatedAt: string
  cancelWindowEndsAt?: string
  cancelAllowed?: boolean
  items: OrderItem[]
}

type ApiOrder = Record<string, unknown>
type ApiOrderItem = Record<string, unknown>
type Product = { id: number; imageUrl?: string; ImageUrl?: string; imageURL?: string }

const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'preparing', 'out for delivery', 'outfordelivery'])
const PAST_STATUSES = new Set(['delivered', 'completed', 'cancelled'])
const fallbackThumb = 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80'
const CANCEL_WINDOW_MS = 60 * 60 * 1000

const normalizeOrderItem = (item: ApiOrderItem): OrderItem => ({
  productId: Number(item.productId ?? item.ProductId ?? 0),
  productName: String(item.productName ?? item.ProductName ?? 'Item'),
  productImageUrl: String(item.productImageUrl ?? item.ProductImageUrl ?? ''),
  quantity: Number(item.quantity ?? item.Quantity ?? 0),
  price: Number(item.price ?? item.Price ?? 0),
  subTotal: Number(item.subTotal ?? item.SubTotal ?? 0),
})

const normalizeOrder = (row: ApiOrder): OrderRecord => ({
  id: Number(row.id ?? row.Id ?? 0),
  status: String(row.status ?? row.Status ?? 'Pending'),
  totalAmount: Number(row.totalAmount ?? row.TotalAmount ?? 0),
  firstName: String(row.firstName ?? row.FirstName ?? ''),
  lastName: String(row.lastName ?? row.LastName ?? ''),
  address: String(row.address ?? row.Address ?? ''),
  addressLine2: String(row.addressLine2 ?? row.AddressLine2 ?? ''),
  fullAddress: String(row.fullAddress ?? row.FullAddress ?? ''),
  city: String(row.city ?? row.City ?? ''),
  phoneNumber: String(row.phoneNumber ?? row.PhoneNumber ?? ''),
  confirmedAt: String(row.confirmedAt ?? row.ConfirmedAt ?? ''),
  createdAt: String(row.createdAt ?? row.CreatedAt ?? new Date().toISOString()),
  updatedAt: String(row.updatedAt ?? row.UpdatedAt ?? new Date().toISOString()),
  cancelWindowEndsAt: String(row.cancelWindowEndsAt ?? row.CancelWindowEndsAt ?? ''),
  cancelAllowed:
    typeof (row.cancelAllowed ?? row.CancelAllowed) === 'boolean'
      ? ((row.cancelAllowed ?? row.CancelAllowed) as boolean)
      : String(row.cancelAllowed ?? row.CancelAllowed).toLowerCase() === 'true',
  items: Array.isArray(row.items ?? row.Items) ? ((row.items ?? row.Items) as ApiOrderItem[]).map(normalizeOrderItem) : [],
})

export default function OrderHistoryPage() {
  const { isAuthenticated, userId } = useAuth()
  const { notify } = useToast()
  const { refreshCart, addToCart } = useCart()
  const navigate = useNavigate()

  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null)
  const [productImageMap, setProductImageMap] = useState<Record<number, string>>({})

  const loadOrders = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/api/order/${userId}`)
      const payload = Array.isArray(response.data) ? response.data : []
      setOrders(payload.map((row) => normalizeOrder(row as ApiOrder)))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not fetch order history.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      navigate('/login', { state: { from: '/orders', message: 'Please login to see your order history.' } })
      return
    }
    loadOrders()
  }, [isAuthenticated, navigate, userId, loadOrders])

  const activeOrders = useMemo(
    () =>
      orders.filter((order) => {
        const normalized = order.status.toLowerCase()
        if (ACTIVE_STATUSES.has(normalized)) return true
        return !PAST_STATUSES.has(normalized)
      }),
    [orders],
  )

  const pastOrders = useMemo(
    () => orders.filter((order) => PAST_STATUSES.has(order.status.toLowerCase())),
    [orders],
  )

  useEffect(() => {
    api
      .get('/api/product')
      .then((res) => {
        const map: Record<number, string> = {}
        const items = Array.isArray(res.data) ? (res.data as Product[]) : []
        for (const p of items) {
          const raw = p.imageUrl ?? p.ImageUrl ?? p.imageURL
          if (typeof raw === 'string' && raw.trim().length > 0) {
            map[p.id] = raw
          }
        }
        setProductImageMap(map)
      })
      .catch(() => {
        setProductImageMap({})
      })
  }, [])

  const canCancelWithinHour = (order: OrderRecord) => {
    const windowEnd = new Date(order.cancelWindowEndsAt ?? '').getTime()
    if (!Number.isNaN(windowEnd)) {
      return Date.now() <= windowEnd
    }

    const start = new Date(order.createdAt).getTime()
    if (!Number.isNaN(start)) {
      return Date.now() - start <= CANCEL_WINDOW_MS
    }

    return true
  }

  const canCancel = (order: OrderRecord) => {
    if (order.status.toLowerCase() === 'cancelled') return false
    if (typeof order.cancelAllowed === 'boolean') return order.cancelAllowed
    return canCancelWithinHour(order)
  }

  const resolveOrderItemImage = (item: OrderItem) => {
    const raw = (item.productImageUrl || productImageMap[item.productId] || '').trim()
    return resolveImageUrl(raw) ?? fallbackThumb
  }

  const cancelOrder = async (orderId: number) => {
    const target = orders.find((o) => o.id === orderId)
    if (target && !canCancel(target)) return

    try {
      setBusyOrderId(orderId)
      const response = await api.post(`/api/order/cancel/${orderId}`)
      notify(String(response.data?.message ?? 'Order cancelled successfully.'), 'success')
      await loadOrders()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not cancel order.'
      notify(message, 'error')
    } finally {
      setBusyOrderId(null)
    }
  }

  const reorder = async (orderId: number) => {
    try {
      setBusyOrderId(orderId)
      const response = await api.post(`/api/order/reorder/${orderId}`)
      await refreshCart()
      notify(String(response.data?.message ?? 'Items added to cart.'), 'success')
      await loadOrders()
      navigate('/checkout')
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        const order = orders.find((o) => o.id === orderId)
        if (order && userId && order.items.length > 0) {
          for (const item of order.items) {
            await addToCart(item.productId, item.quantity)
          }
          await refreshCart()
          notify('Items added to cart.', 'success')
          navigate('/checkout')
          return
        }
      }
      const message = err instanceof Error ? err.message : 'Could not reorder.'
      notify(message, 'error')
    } finally {
      setBusyOrderId(null)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <h1 className="font-serif text-5xl font-semibold text-[var(--ink)]">Order History</h1>
      <p className="mt-2 text-[var(--rosewood)]/85">Review your past orders and track your current ones.</p>

      {error && <div className="mt-5"><Alert message={error} type="error" /></div>}
      {loading && <p className="mt-5 text-[var(--rosewood)]/80">Loading orders...</p>}

      <section className="mt-10">
        <h2 className="font-serif text-4xl text-[var(--ink)]">Active Orders</h2>
        <div className="mt-4 space-y-4">
          {activeOrders.length === 0 ? (
            <div className="rounded-2xl bg-white p-5 text-[var(--rosewood)]/80">No active orders.</div>
          ) : (
            activeOrders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-[var(--stone)]/40 bg-[#efe3cf] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--rosewood)]/80">Order #{order.id}</p>
                    <p className="font-semibold text-[var(--ink)]">{order.status}</p>
                    <p className="text-sm text-[var(--rosewood)]/80">Placed {new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <Button
                    variant="ghost"
                    disabled={!canCancel(order) || busyOrderId === order.id}
                    onClick={() => cancelOrder(order.id)}
                    className="border border-[#c36957] text-[#b03a27] disabled:opacity-60"
                  >
                    {order.status.toLowerCase() === 'cancelled' ? 'Cancelled' : canCancel(order) ? 'Cancel Order' : 'Cancel Unavailable'}
                  </Button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={`${order.id}-${item.productId}`} className="flex items-center gap-3 rounded-xl bg-white/80 p-3">
                        <img src={resolveOrderItemImage(item)} alt={item.productName} className="h-14 w-14 rounded-md object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-[var(--ink)]">{item.productName}</p>
                          <p className="text-xs text-[var(--rosewood)]/80">Qty {item.quantity} · ${item.price.toFixed(2)} ea</p>
                        </div>
                        <p className="font-semibold text-[var(--ink)]">${item.subTotal.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--rosewood)]/75">Delivery Address</p>
                    <p className="mt-2 text-sm text-[var(--ink)]">{order.fullAddress || `${order.address ?? ''} ${order.addressLine2 ?? ''} ${order.city ?? ''}`.trim()}</p>
                    <p className="mt-3 text-sm text-[var(--rosewood)]/90">Total: <span className="font-semibold text-[var(--ink)]">${order.totalAmount.toFixed(2)}</span></p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-4xl text-[var(--ink)]">Past Orders</h2>
        <div className="mt-4 space-y-4">
          {pastOrders.length === 0 ? (
            <div className="rounded-2xl bg-white p-5 text-[var(--rosewood)]/80">No past orders yet.</div>
          ) : (
            pastOrders.map((order) => {
              const deliveredAt = new Date(order.updatedAt).toLocaleString()
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
              const names = order.items.map((item) => item.productName).join(', ')

              return (
                <article key={order.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--stone)]/30 bg-white p-4">
                  <div className="flex gap-2">
                    {(order.items.length > 0 ? order.items : [{ productId: 0, productName: 'Order', productImageUrl: '', quantity: 0, price: 0, subTotal: 0 }])
                      .slice(0, 3)
                      .map((item) => (
                        <img
                          key={`${order.id}-${item.productId}-${item.productName}`}
                          src={resolveOrderItemImage(item)}
                          alt={item.productName}
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                      ))}
                  </div>
                  <div className="min-w-[240px] flex-1">
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--rosewood)]/80">Order #{order.id} · {order.status}</p>
                    <p className="font-serif text-2xl text-[var(--ink)]">{names}</p>
                    <p className="text-sm text-[var(--rosewood)]/85">{itemCount} items · Total: ${order.totalAmount.toFixed(2)}</p>
                    <p className="text-xs text-[var(--rosewood)]/75">Delivered/updated: {deliveredAt}</p>
                    <p className="text-xs text-[var(--rosewood)]/75">Address: {order.fullAddress || `${order.address ?? ''} ${order.addressLine2 ?? ''} ${order.city ?? ''}`.trim()}</p>
                  </div>
                  <Button onClick={() => reorder(order.id)} disabled={busyOrderId === order.id}>
                    Reorder
                  </Button>
                </article>
              )
            })
          )}
        </div>
      </section>
    </main>
  )
}
