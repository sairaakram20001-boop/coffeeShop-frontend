import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useToast } from '../hooks/useToast'
import CartItem from './CartItem'
import Button from './Button'

export default function CartDrawer() {
  const { isOpen, setIsOpen, items, totalAmount, removeItem, changeItemQuantity } = useCart()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null)

  const placeOrder = async () => {
    setIsOpen(false)
    notify('Complete details and place your order from checkout page.', 'info')
    navigate('/checkout')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/25"
            onClick={() => setIsOpen(false)}
          />
          <motion.aside
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-[var(--porcelain)] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[var(--ink)]">Your Cart</h3>
              <button onClick={() => setIsOpen(false)} className="text-2xl">x</button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-sm text-amber-900/70">No items yet.</p>
              ) : (
                items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    isUpdating={updatingItemId === item.id}
                    onRemove={(id) => {
                      setUpdatingItemId(id)
                      removeItem(id).finally(() => setUpdatingItemId(null))
                    }}
                    onChangeQuantity={(id, delta) => {
                      setUpdatingItemId(id)
                      changeItemQuantity(id, delta).finally(() => setUpdatingItemId(null))
                    }}
                  />
                ))
              )}
            </div>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-white p-4">
              <p className="text-sm text-amber-900/70">Total Amount</p>
              <p className="text-2xl font-black text-[var(--ink)]">${totalAmount.toFixed(2)}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button className="w-full" onClick={() => setIsOpen(false)}>
                  Continue Shopping
                </Button>
                <Button className="w-full" variant="secondary" onClick={placeOrder} disabled={items.length === 0}>
                  Place Order
                </Button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
