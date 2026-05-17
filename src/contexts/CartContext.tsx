import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export type CartItem = {
  id: number
  productId: number
  productName: string
  imageUrl?: string
  price: number
  quantity: number
  total: number
}

type CartResponse = {
  id: number
  userId: number
  items: CartItem[]
}

type CartContextValue = {
  items: CartItem[]
  totalAmount: number
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  refreshCart: () => Promise<void>
  addToCart: (productId: number, quantity?: number) => Promise<void>
  removeItem: (cartItemId: number) => Promise<void>
  changeItemQuantity: (cartItemId: number, delta: 1 | -1) => Promise<void>
  clearCart: () => Promise<void>
}

export const CartContext = createContext<CartContextValue | undefined>(undefined)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { userId } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const mapCart = (data: CartResponse) =>
    (data.items ?? []).map((item) => ({
      ...item,
      productName: (item as { ProductName?: string }).ProductName ?? item.productName,
      imageUrl: (item as { ImageUrl?: string }).ImageUrl ?? item.imageUrl,
      price: (item as { Price?: number }).Price ?? item.price,
      quantity: (item as { Quantity?: number }).Quantity ?? item.quantity,
      total: (item as { Total?: number }).Total ?? item.total,
      id: (item as { Id?: number }).Id ?? item.id,
      productId: (item as { ProductId?: number }).ProductId ?? item.productId,
    }))

  const refreshCart = useCallback(async () => {
    if (!userId) {
      setItems([])
      return
    }

    try {
      const response = await api.get(`/api/cart/${userId}`)
      setItems(mapCart(response.data))
    } catch {
      setItems([])
    }
  }, [userId])

  const addToCart = async (productId: number, quantity = 1) => {
    if (!userId) {
      throw new Error('AUTH_REQUIRED')
    }

    await api.post('/api/cart/add', { userId, productId, quantity })
    await refreshCart()
  }

  const removeItem = async (cartItemId: number) => {
    await api.delete(`/api/cart/remove/${cartItemId}`)
    await refreshCart()
  }

  const changeItemQuantity = async (cartItemId: number, delta: 1 | -1) => {
    await api.put(`/api/cart/quantity/${cartItemId}`, { delta })
    await refreshCart()
  }

  const clearCart = async () => {
    if (!userId) return
    await api.delete(`/api/cart/clear/${userId}`)
    setItems([])
  }

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const value = useMemo(
    () => ({
      items,
      totalAmount,
      isOpen,
      setIsOpen,
      refreshCart,
      addToCart,
      removeItem,
      changeItemQuantity,
      clearCart,
    }),
    [items, totalAmount, isOpen, refreshCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
